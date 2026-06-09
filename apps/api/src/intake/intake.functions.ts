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
        attachments,
      } = event.data as ParseEmailEventData;

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
          const userText =
            pdfText.length > 0
              ? `RATE CONFIRMATION DOCUMENT:\n${pdfText}\n\nEMAIL BODY:\n${textBody}`
              : `EMAIL BODY:\n${textBody}\n\nSUBJECT: ${subject}\nFROM: ${fromEmail}`;

          const system = `You are a freight document parser for a trucking company.
Extract structured load data from the provided broker email or rate confirmation.
Return ONLY a create_load tool call. No explanation. No commentary.
If a field cannot be found with high confidence, set it to null.
CRITICAL: Never invent or infer a rate not explicitly stated in the document.
A rate must appear as a dollar amount. If no rate is visible, set rate to null.`;

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
