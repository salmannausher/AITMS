import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';
import { type AiProvider } from '../ai/ai-provider';
import { type ParseEmailEventData, type ParsedLoad } from './intake.types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
) => Promise<{ text: string }>;

const logger = new Logger('IntakeAgent');

// ---------------------------------------------------------------------------
// Simple state-to-state distance lookup (miles). Falls back to 800 if unknown.
// ---------------------------------------------------------------------------
const STATE_DISTANCES: Record<string, number> = {
  'CA-OR': 640,  'CA-WA': 1140, 'CA-NV': 570,  'CA-AZ': 760,
  'CA-TX': 1430, 'CA-IL': 2020, 'CA-FL': 2750,  'CA-NY': 2820,
  'TX-IL': 920,  'TX-FL': 1320, 'TX-NY': 1770,  'TX-GA': 810,
  'TX-OH': 1200, 'TX-PA': 1570, 'TX-TN': 890,   'TX-NC': 1360,
  'IL-NY': 790,  'IL-FL': 1340, 'IL-OH': 310,   'IL-GA': 720,
  'IL-PA': 740,  'IL-TN': 480,  'IL-MO': 300,
  'FL-NY': 1280, 'FL-GA': 340,  'FL-OH': 1060,  'FL-PA': 1230,
  'NY-PA': 200,  'NY-OH': 460,  'NY-GA': 870,
  'OH-PA': 130,  'OH-GA': 700,  'OH-TN': 530,
  'GA-PA': 870,  'GA-NC': 350,  'GA-TN': 250,
};

function estimateMiles(originState: string, destState: string): number {
  if (originState === destState) return 200;
  const key = [originState.toUpperCase(), destState.toUpperCase()]
    .sort()
    .join('-');
  return STATE_DISTANCES[key] ?? 800;
}

// ---------------------------------------------------------------------------
// Factory — accepts services so the function stays testable and DI-friendly
// ---------------------------------------------------------------------------
export function createParseEmailFunction(
  prisma: PrismaService,
  aiProvider: AiProvider,
) {
  return inngest.createFunction(
    {
      id: 'parse-email',
      retries: 3,
      triggers: [{ event: 'load/email.received' as const }],
      onFailure: async ({
        event: failureEvent,
        error,
      }: {
        event: { data: { event: { data: ParseEmailEventData } } };
        error: Error;
      }) => {
        const messageId =
          failureEvent.data?.event?.data?.messageId ?? 'unknown';

        logger.error('parse-email failed', {
          messageId,
          error: error.message,
        });

        try {
          const existing = await prisma.aiTask.findFirst({
            where: { entity_id: messageId, agent: 'intake' },
          });
          if (existing) {
            await prisma.aiTask.update({
              where: { id: existing.id },
              data: { status: 'FAILED', error: error.message },
            });
          }
        } catch (dbErr) {
          logger.error('onFailure: could not update AiTask', dbErr);
        }
      },
    },
    async ({ event, step }) => {
      const {
        messageId,
        companyId,
        fromEmail,
        subject,
        textBody,
        attachments = [],
      } = event.data as ParseEmailEventData;

      if (!companyId) {
        logger.error(`parse-email: missing companyId for message ${messageId}`);
        return { loadId: null, skipped: true };
      }

      // ── Tenant verification ─────────────────────────────────────────────
      // Never trust the event's companyId blindly. The Message record (written
      // by the webhook) is the source of truth for which tenant this email
      // belongs to. If a forged event names a real message but a different
      // company, abort before creating any cross-tenant records.
      const sourceMessage = await step.run('verify-tenant', async () =>
        prisma.message.findUnique({
          where: { id: messageId },
          select: { company_id: true },
        }),
      );
      if (sourceMessage && sourceMessage.company_id !== companyId) {
        logger.error(
          `parse-email: companyId mismatch for message ${messageId} ` +
            `(event=${companyId}, actual=${sourceMessage.company_id}) — aborting`,
        );
        return { loadId: null, skipped: 'tenant mismatch' };
      }

      // ── Step 1: Extract PDF text ────────────────────────────────────────
      const { pdfText, claudeDocuments } = await step.run(
        'extract-pdf',
        async () => {
          const pdfAttachments = attachments.filter(
            (a) => a.mimeType === 'application/pdf',
          );
          if (pdfAttachments.length === 0) {
            return { pdfText: '', claudeDocuments: [] as Array<{ name: string; dataBase64: string }> };
          }

          const texts: string[] = [];
          const fallbackDocs: Array<{ name: string; dataBase64: string }> = [];

          for (const attachment of pdfAttachments) {
            try {
              const buffer = Buffer.from(attachment.data, 'base64');
              const result = await pdfParse(buffer);
              if (result.text.length >= 50) {
                texts.push(result.text);
              } else {
                // pdf-parse returned too little text — fall back to Claude native PDF
                fallbackDocs.push({ name: attachment.name, dataBase64: attachment.data });
              }
            } catch (err) {
              logger.warn(
                `Failed to parse PDF attachment: ${attachment.name} — falling back to Claude document block`,
                err,
              );
              fallbackDocs.push({ name: attachment.name, dataBase64: attachment.data });
            }
          }

          return {
            pdfText: texts.join('\n\n---\n\n'),
            claudeDocuments: fallbackDocs,
          };
        },
      );

      // ── Step 2: AI parse (Anthropic or OpenRouter) ─────────────────────
      const { parsed, inputTokens, outputTokens, modelUsed } = await step.run(
        'claude-parse',
        async () => {
          const today = new Date();
          const todayLine = `TODAY'S DATE: ${today.toISOString().slice(0, 10)} (${today.toLocaleDateString('en-US', { weekday: 'long' })})`;

          const userText =
            pdfText.length > 0
              ? `${todayLine}\n\nRATE CONFIRMATION DOCUMENT:\n${pdfText}\n\nEMAIL BODY:\n${textBody}`
              : `${todayLine}\n\nEMAIL BODY:\n${textBody}\n\nSUBJECT: ${subject}\nFROM: ${fromEmail}`;

          const system = `You are a freight document parser for a trucking dispatch system.
Extract structured load data from broker emails and rate confirmation documents.
Return ONLY a create_load tool call. No explanation. No commentary.

PARTIES — do not confuse them:
- broker_name = the company OFFERING the load (usually the email sender / letterhead on the rate-con).
- The shipper/consignee (pickup and delivery facilities) are NOT the broker.
- The carrier (the trucking company being hired) is NOT the broker.

LOCATIONS:
- origin_city/origin_state = the FIRST pickup. dest_city/dest_state = the LAST delivery.
- Extract city and 2-letter uppercase state code only (e.g. "Chicago" + "IL"), never facility names or street addresses.
- Convert full state names to 2-letter codes ("Illinois" → "IL").

DATES:
- Always ISO format YYYY-MM-DD.
- Resolve relative dates ("tomorrow", "Monday", "6/16" with no year) using TODAY'S DATE given in the message. If no date can be determined, set pickup_date to today's date and confidence to 0.5 or lower.

RATE:
- rate = total all-in carrier pay in USD. If linehaul and fuel surcharge are listed separately, SUM them. Exclude detention/lumper/accessorial estimates.
- If only a per-mile rate appears with no total, set rate to null.
- NEVER invent or infer a rate not explicitly stated as a dollar amount.

OTHER FIELDS:
- load_type: infer from trailer/commodity wording — "reefer/refrigerated/frozen/temp-controlled" → REEFER; "53' van/dry van" → DRY_VAN; "flatbed/tarp/coil/lumber" → FLATBED; "step deck/stepdeck/drop deck" → STEP_DECK. Unclear → null.
- weight: pounds. Convert tons (×2000). Strip "lbs"/commas.
- reference_number: the broker's load/PRO/confirmation number, not the MC number.

CONFIDENCE — be honest, this gates human review:
- 0.9+: all required fields explicit in the document.
- 0.7–0.85: a required field was inferred or ambiguous.
- ≤0.5: dates missing/guessed, OR multiple loads in one email (parse only the first), OR this may not be a load offer at all.
- 0: the email contains no load (payment reminder, spam, general inquiry).`;

          const result = await aiProvider.parseEmail({
            system,
            userText,
            claudeDocuments,
          });

          return {
            parsed: result.toolInput as unknown as ParsedLoad,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            modelUsed: result.modelUsed,
          };
        },
      );

      // Confidence 0 means the model determined the email contains no load
      // (spam, payment reminder, general inquiry) — skip creation entirely.
      if (parsed.confidence !== undefined && parsed.confidence <= 0.2) {
        logger.warn(
          `Email ${messageId} parsed with confidence ${parsed.confidence} — no load created`,
        );
        return { loadId: null, confidence: parsed.confidence, skipped: true };
      }

      // ── Step 3: Create DB records ───────────────────────────────────────
      const load = await step.run('create-db-records', async () => {
        const domain = fromEmail.split('@')[1] ?? fromEmail;

        // 3a. Find or create Broker
        let broker = await prisma.broker.findFirst({
          where: {
            company_id: companyId,
            email_domains: { has: domain },
          },
        });
        if (!broker) {
          broker = await prisma.broker.create({
            data: {
              company_id: companyId,
              name: parsed.broker_name ?? domain,
              mc_number: parsed.broker_mc_number ?? null,
              email_domains: [domain],
            },
          });
        }

        // 3b. Estimate miles + RPM
        const estimatedMiles = estimateMiles(
          parsed.origin_state,
          parsed.dest_state,
        );
        const rpm =
          parsed.rate != null && estimatedMiles > 0
            ? Number((parsed.rate / estimatedMiles).toFixed(3))
            : null;

        // 3c. Create Load
        const newLoad = await prisma.load.create({
          data: {
            company_id: companyId,
            broker_id: broker.id,
            origin_city: parsed.origin_city,
            origin_state: parsed.origin_state,
            dest_city: parsed.dest_city,
            dest_state: parsed.dest_state,
            pickup_date: new Date(parsed.pickup_date),
            delivery_date: parsed.delivery_date
              ? new Date(parsed.delivery_date)
              : null,
            rate: parsed.rate ?? null,
            rpm,
            estimated_miles: estimatedMiles,
            load_type: parsed.load_type ?? null,
            weight: parsed.weight ?? null,
            reference_number: parsed.reference_number ?? null,
            status: 'PENDING',
            needs_review: (parsed.confidence ?? 0) < 0.85,
            source: 'EMAIL',
            raw_email_id: messageId,
          },
        });

        // 3d. Link Message → Load (updateMany won't throw if msg not found)
        await prisma.message.updateMany({
          where: { id: messageId },
          data: { load_id: newLoad.id },
        });

        // 3e. Create AiTask record
        await prisma.aiTask.create({
          data: {
            company_id: companyId,
            agent: 'intake',
            task_type: 'parse_email',
            entity_type: 'load',
            entity_id: newLoad.id,
            input: {
              fromEmail,
              subject,
              textBodyLength: textBody.length,
              attachmentCount: attachments.length,
            },
            output: parsed as unknown as Prisma.InputJsonValue,
            model: modelUsed,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            status: 'COMPLETED',
            human_reviewed: false,
          },
        });

        return newLoad;
      });

      // ── Step 4: Trigger Rate Analysis Agent ─────────────────────────────
      await step.sendEvent('trigger-scoring', {
        name: 'load/created',
        data: { loadId: load.id, companyId },
      });

      return { loadId: load.id, confidence: parsed.confidence ?? 0 };
    },
  );
}
