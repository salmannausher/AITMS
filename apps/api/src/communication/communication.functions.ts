import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';
import { type AiProvider } from '../ai/ai-provider';
import { MessagingService } from '../messaging/messaging.service';
import {
  type LoadAssignedEventData,
  type DriverRepliedEventData,
  type AssignmentMessageContext,
  type ReplyClassification,
} from './communication.types';

const logger = new Logger('CommunicationAgent');

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatPickupDate(d: Date): string {
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Function 1: send-assignment-message
// Triggered by load/assigned — drafts and sends the WhatsApp to the driver.
// ─────────────────────────────────────────────────────────────────────────────

export function createSendAssignmentFunction(
  prisma: PrismaService,
  aiProvider: AiProvider,
  messaging: MessagingService,
) {
  return inngest.createFunction(
    {
      id: 'send-assignment-message',
      retries: 2,
      triggers: [{ event: 'load/assigned' as const }],
    },
    async ({ event, step }) => {
      const { loadId, companyId, driverId } = event.data as LoadAssignedEventData;

      // ── Step 1: Fetch load, driver, and company settings ──────────────────
      const context = await step.run('fetch-context', async () => {
        const load = await prisma.load.findUnique({
          where: { id: loadId },
          select: {
            id: true,
            status: true,
            origin_city: true,
            origin_state: true,
            dest_city: true,
            dest_state: true,
            pickup_date: true,
            load_type: true,
            weight: true,
            rate: true,
          },
        });

        if (!load) return { skipped: 'load not found' as const };
        if (load.status !== 'ASSIGNED') return { skipped: 'load not in ASSIGNED status' as const };

        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
          select: { id: true, full_name: true, phone: true, whatsapp_phone: true },
        });

        if (!driver) return { skipped: 'driver not found' as const };

        const contactPhone = driver.whatsapp_phone ?? driver.phone;
        if (!contactPhone) {
          await prisma.load.update({ where: { id: loadId }, data: { needs_review: true } });
          return { skipped: 'driver has no phone number' as const };
        }

        const company = await prisma.company.findUnique({
          where: { id: companyId },
          select: { settings: true },
        });

        const settings = (company?.settings as Record<string, unknown> | null) ?? {};
        const costs = (settings['costs'] as Record<string, unknown> | null) ?? {};
        const showRate = (costs['show_rate_to_driver'] as boolean | undefined) ?? false;

        return { load, driver, contactPhone, showRate };
      });

      if ('skipped' in context) {
        logger.warn(`send-assignment-message skipped for load ${loadId}: ${context.skipped}`);
        return { loadId, skipped: context.skipped };
      }

      const { load, driver, contactPhone, showRate } = context;

      // ── Step 2: Draft the WhatsApp message via AI ─────────────────────────
      const draftedMessage = await step.run('draft-message', async () => {
        const msgContext: AssignmentMessageContext = {
          driverName: driver.full_name,
          originCity: load.origin_city,
          originState: load.origin_state,
          destCity: load.dest_city,
          destState: load.dest_state,
          pickupDate: formatPickupDate(new Date(load.pickup_date)),
          loadType: load.load_type ?? 'Dry Van',
          weightLbs: load.weight,
          rateUsd: showRate && load.rate != null ? Number(load.rate) : null,
        };
        return aiProvider.draftAssignmentMessage(msgContext);
      });

      // ── Step 3: Send WhatsApp + create AiTask record ──────────────────────
      await step.run('send-message', async () => {
        await messaging.sendWhatsApp(contactPhone, draftedMessage, {
          companyId,
          loadId: load.id,
          driverId: driver.id,
        });

        await prisma.aiTask.create({
          data: {
            company_id: companyId,
            agent: 'communication',
            task_type: 'ASSIGNMENT_MESSAGE_DRAFT',
            entity_type: 'load',
            entity_id: loadId,
            model: 'claude-haiku-4-5',
            input: { loadId, driverId, contactPhone } as unknown as Prisma.InputJsonValue,
            output: draftedMessage as unknown as Prisma.InputJsonValue,
            status: 'COMPLETED',
          },
        });
      });

      logger.log(`Assignment message sent to driver ${driver.full_name} for load ${loadId}`);

      // ── Step 4: Sleep 30 min then check if driver replied ─────────────────
      await step.sleep('wait-for-reply', '30m');

      const freshLoad = await step.run('check-reply-received', async () => {
        return prisma.load.findUnique({
          where: { id: loadId },
          select: { driver_confirmed_at: true, driver_declined_at: true, status: true },
        });
      });

      if (!freshLoad?.driver_confirmed_at && !freshLoad?.driver_declined_at) {
        await step.sendEvent('no-reply-alert', {
          name: 'driver/no-reply',
          data: {
            loadId: load.id,
            companyId,
            driverId: driver.id,
            driverName: driver.full_name,
            origin: `${load.origin_city} ${load.origin_state}`,
            dest: `${load.dest_city} ${load.dest_state}`,
          },
        });
        logger.warn(`No reply from driver ${driver.full_name} after 30 min for load ${loadId}`);
      }

      return { loadId, sent: true };
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Function 2: parse-driver-reply
// Triggered by driver/replied — classifies the reply and acts on it.
// ─────────────────────────────────────────────────────────────────────────────

export function createParseDriverReplyFunction(
  prisma: PrismaService,
  aiProvider: AiProvider,
  _messaging: MessagingService, // reserved for future reply messages
) {
  return inngest.createFunction(
    {
      id: 'parse-driver-reply',
      retries: 2,
      triggers: [{ event: 'driver/replied' as const }],
    },
    async ({ event, step }) => {
      const { driverId, loadId, companyId, body: replyBody } =
        event.data as DriverRepliedEventData;

      // ── Step 1: Fetch driver + load ───────────────────────────────────────
      const context = await step.run('fetch-context', async () => {
        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
          select: { id: true, full_name: true },
        });

        const load = await prisma.load.findUnique({
          where: { id: loadId },
          select: {
            id: true,
            status: true,
            origin_city: true,
            origin_state: true,
            dest_city: true,
            dest_state: true,
            assigned_truck_id: true,
          },
        });

        if (!driver || !load) return { skipped: 'driver or load not found' as const };
        if (load.status !== 'ASSIGNED') return { skipped: 'load_not_assigned' as const };

        return { driver, load };
      });

      if ('skipped' in context) {
        logger.warn(`parse-driver-reply skipped for load ${loadId}: ${context.skipped}`);
        return { loadId, skipped: context.skipped };
      }

      const { driver, load } = context;

      // ── Step 2: Classify the reply with AI ────────────────────────────────
      const classification = await step.run('classify-reply', async () => {
        const raw = await aiProvider.classifyDriverReply({
          driverName: driver.full_name,
          replyBody,
          loadOrigin: `${load.origin_city} ${load.origin_state}`,
          loadDest: `${load.dest_city} ${load.dest_state}`,
        });

        const result: ReplyClassification =
          raw.confidence < 0.6 ? { ...raw, intent: 'UNCLEAR' } : raw;

        await prisma.aiTask.create({
          data: {
            company_id: companyId,
            agent: 'communication',
            task_type: 'DRIVER_REPLY_CLASSIFICATION',
            entity_type: 'load',
            entity_id: loadId,
            model: 'claude-haiku-4-5',
            input: {
              driverName: driver.full_name,
              replyBody,
            } as unknown as Prisma.InputJsonValue,
            output: result as unknown as Prisma.InputJsonValue,
            status: 'COMPLETED',
          },
        });

        return result;
      });

      // ── Step 3: Act on intent (all DB writes in one step) ─────────────────
      await step.run('act-on-intent', async () => {
        switch (classification.intent) {
          case 'ACCEPT':
            await prisma.$transaction([
              prisma.load.update({
                where: { id: loadId },
                data: { driver_confirmed_at: new Date() },
              }),
              prisma.loadEvent.create({
                data: {
                  load_id: loadId,
                  event_type: 'DRIVER_ACCEPTED',
                  actor_type: 'DRIVER',
                  actor_id: driverId,
                  metadata: { reply_body: replyBody, actor_name: driver.full_name } as unknown as Prisma.InputJsonValue,
                },
              }),
            ]);
            break;

          case 'DECLINE': {
            // Build operations; conditionally include truck revert
            const truckOp = load.assigned_truck_id
              ? [prisma.truck.update({ where: { id: load.assigned_truck_id }, data: { status: 'AVAILABLE' } })]
              : [];

            await prisma.$transaction([
              prisma.load.update({
                where: { id: loadId },
                data: {
                  driver_declined_at: new Date(),
                  assigned_driver_id: null,
                  assigned_truck_id: null,
                  status: 'ACCEPTED',
                },
              }),
              prisma.driver.update({ where: { id: driverId }, data: { status: 'AVAILABLE' } }),
              prisma.loadEvent.create({
                data: {
                  load_id: loadId,
                  event_type: 'DRIVER_DECLINED',
                  actor_type: 'DRIVER',
                  actor_id: driverId,
                  metadata: { reply_body: replyBody, actor_name: driver.full_name } as unknown as Prisma.InputJsonValue,
                },
              }),
              ...truckOp,
            ]);
            break;
          }

          case 'ETA_UPDATE':
            await prisma.loadEvent.create({
              data: {
                load_id: loadId,
                event_type: 'DRIVER_ETA_UPDATE',
                actor_type: 'DRIVER',
                actor_id: driverId,
                metadata: {
                  raw_eta: classification.extracted_eta,
                  reply_body: replyBody,
                  actor_name: driver.full_name,
                } as unknown as Prisma.InputJsonValue,
              },
            });
            break;

          default:
            // QUESTION, STATUS_UPDATE, UNCLEAR — log and alert dispatcher
            await prisma.loadEvent.create({
              data: {
                load_id: loadId,
                event_type: 'DRIVER_MESSAGE',
                actor_type: 'DRIVER',
                actor_id: driverId,
                metadata: {
                  reply_body: replyBody,
                  intent: classification.intent,
                  reason: classification.reason,
                  actor_name: driver.full_name,
                } as unknown as Prisma.InputJsonValue,
              },
            });
            break;
        }
      });

      // ── Emit downstream Inngest events (outside step.run) ─────────────────
      if (classification.intent === 'ACCEPT') {
        await step.sendEvent('driver-accepted', {
          name: 'driver/accepted',
          data: { loadId, companyId, driverId, driverName: driver.full_name },
        });
      } else if (classification.intent === 'DECLINE') {
        await step.sendEvent('driver-declined', {
          name: 'driver/declined',
          data: { loadId, companyId, driverId, driverName: driver.full_name },
        });
      } else if (classification.intent === 'ETA_UPDATE') {
        await step.sendEvent('eta-update', {
          name: 'driver/eta-update',
          data: {
            loadId,
            companyId,
            driverName: driver.full_name,
            eta: classification.extracted_eta,
          },
        });
      } else {
        await step.sendEvent('driver-message-alert', {
          name: 'driver/message-needs-review',
          data: {
            loadId,
            companyId,
            driverId,
            driverName: driver.full_name,
            intent: classification.intent,
            body: replyBody,
          },
        });
      }

      logger.log(
        `parse-driver-reply: load ${loadId} — intent=${classification.intent} confidence=${classification.confidence}`,
      );
      return { loadId, intent: classification.intent };
    },
  );
}
