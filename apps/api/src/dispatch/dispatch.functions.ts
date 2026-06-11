import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';
import { type AiProvider } from '../ai/ai-provider';
import { getDeadheadMiles } from './state-distances';
import {
  type LoadAcceptedEventData,
  type DriverCandidate,
  type RankDriversToolOutput,
} from './dispatch.types';

const logger = new Logger('DispatchAgent');

export function createRankDriversFunction(prisma: PrismaService, aiProvider: AiProvider) {
  return inngest.createFunction(
    {
      id: 'rank-drivers',
      retries: 2,
      triggers: [{ event: 'load/accepted' as const }],
      onFailure: async ({
        event: failureEvent,
        error,
      }: {
        event: { data: { event: { data: LoadAcceptedEventData } } };
        error: Error;
      }) => {
        const loadId = failureEvent.data?.event?.data?.loadId ?? 'unknown';
        logger.error('rank-drivers failed', { loadId, error: error.message });

        try {
          const existing = await prisma.aiTask.findFirst({
            where: { entity_id: loadId, agent: 'dispatch' },
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
      const { loadId, companyId } = event.data as LoadAcceptedEventData;

      // ── Step 1: Fetch load + available drivers ─────────────────────────────
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
            load_type: true,
            pickup_date: true,
            estimated_miles: true,
          },
        });

        if (!load) return { skipped: 'load not found' as const };
        if (load.status !== 'ACCEPTED') return { skipped: 'load not in ACCEPTED status' as const };

        const dbDrivers = await prisma.driver.findMany({
          where: {
            company_id: companyId,
            status: 'AVAILABLE',
            deleted_at: null,
          },
          include: { truck: { select: { type: true, status: true } } },
          orderBy: { full_name: 'asc' },
        });

        const drivers: DriverCandidate[] = dbDrivers.map((d) => ({
          id: d.id,
          full_name: d.full_name,
          status: d.status,
          home_city: d.home_city,
          home_state: d.home_state,
          hos_remaining_hours: d.hos_remaining_hours,
          cdl_class: d.cdl_class,
          endorsements: (d.endorsements as string[] | null) ?? [],
          assigned_truck_id: d.assigned_truck_id,
          truck_type: d.truck?.type ?? null,
        }));

        if (drivers.length === 0) return { skipped: 'no available drivers' as const };

        // Pre-compute deadhead miles for each driver (TypeScript — not Claude's job)
        const driversWithDeadhead = drivers.map((d) => ({
          ...d,
          deadhead_miles: getDeadheadMiles(d.home_state, load.origin_state),
        }));

        return { load, drivers: driversWithDeadhead };
      });

      if ('skipped' in context) {
        logger.warn(`rank-drivers skipped for load ${loadId}: ${context.skipped}`);
        return { loadId, skipped: context.skipped };
      }

      const { load, drivers } = context;

      // ── Step 2: Claude ranks the drivers ──────────────────────────────────
      const { ranked, inputTokens, outputTokens, modelUsed, latencyMs } = await step.run(
        'claude-rank',
        async () => {
          const system = `You are a dispatch coordinator for a trucking carrier.
Rank the available drivers for this load. Consider:
1. HOS hours remaining — driver needs enough hours to complete the load
2. Deadhead miles — closer drivers are preferred (lower deadhead = better score)
3. Truck type match — match load_type to truck capability
4. Driver status — only AVAILABLE drivers are given to you

Scoring 0-100: 100 = perfect fit, 0 = cannot do this load.
reason must be plain language a dispatcher understands, ≤12 words.
recommendation_summary: ≤20 words describing the top choice and why.

Return ONLY a rank_drivers tool call. Rank up to 5 drivers.`;

          const userMessage = JSON.stringify({
            load: {
              origin: `${load.origin_city}, ${load.origin_state}`,
              destination: `${load.dest_city}, ${load.dest_state}`,
              load_type: load.load_type ?? 'unknown',
              pickup_date: load.pickup_date ? String(load.pickup_date).slice(0, 10) : null,
              estimated_miles: load.estimated_miles,
            },
            available_drivers: drivers.map((d) => ({
              driver_id: d.id,
              name: d.full_name,
              home: `${d.home_city}, ${d.home_state}`,
              hos_remaining_hours: d.hos_remaining_hours,
              cdl_class: d.cdl_class,
              endorsements: d.endorsements,
              truck_type: d.truck_type,
              deadhead_miles: d.deadhead_miles,
            })),
          });

          const result = await aiProvider.rankDrivers({ system, userMessage });

          return {
            ranked: result.toolInput as unknown as RankDriversToolOutput,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            modelUsed: result.modelUsed,
            latencyMs: result.latencyMs,
          };
        },
      );

      // ── Step 3: Persist results to AiTask + update load ───────────────────
      await step.run('save-rankings', async () => {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.aiTask.create({
            data: {
              company_id: companyId,
              agent: 'dispatch',
              task_type: 'rank_drivers',
              entity_type: 'load',
              entity_id: loadId,
              input: {
                loadId,
                driverCount: drivers.length,
                origin: `${load.origin_state}`,
                dest: `${load.dest_state}`,
              },
              output: ranked as unknown as Prisma.InputJsonValue,
              model: modelUsed,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              latency_ms: latencyMs,
              status: 'COMPLETED',
            },
          });

          // Store ranked drivers in load's ai_score_details alongside existing AI data
          const existing = await tx.load.findUnique({
            where: { id: loadId },
            select: { ai_score_details: true },
          });
          const existingDetails =
            (existing?.ai_score_details as Record<string, unknown> | null) ?? {};

          await tx.load.update({
            where: { id: loadId },
            data: {
              ai_score_details: {
                ...existingDetails,
                driver_rankings: ranked,
                driver_rankings_at: new Date().toISOString(),
              } as Prisma.InputJsonValue,
            },
          });
        });
      });

      // ── Step 4: Emit load/drivers-ranked event ────────────────────────────
      await step.sendEvent('notify-dispatch-ready', {
        name: 'load/drivers-ranked',
        data: {
          loadId,
          companyId,
          topDriverId: ranked.ranked_drivers[0]?.driver_id ?? null,
          driverCount: ranked.ranked_drivers.length,
        },
      });

      logger.log(
        `Load ${loadId} driver rankings saved. Top: ${ranked.ranked_drivers[0]?.driver_id ?? 'none'}`,
      );
      return { loadId, rankedCount: ranked.ranked_drivers.length };
    },
  );
}
