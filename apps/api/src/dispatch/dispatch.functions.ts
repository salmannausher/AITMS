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

      if (!companyId) {
        logger.error(`rank-drivers: missing companyId for load ${loadId}`);
        return { loadId, skipped: 'missing companyId' };
      }

      // ── Step 1: Fetch load + available drivers ─────────────────────────────
      const context = await step.run('fetch-context', async () => {
        const load = await prisma.load.findFirst({
          where: { id: loadId, company_id: companyId },
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
          include: { truck: { select: { type: true, status: true, unit_number: true } } },
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
          truck_unit_number: d.truck?.unit_number ?? null,
        }));

        if (drivers.length === 0) return { skipped: 'no available drivers' as const };

        // Hard pre-filter 1: HOS — driver needs at least (estimated_miles / 55mph) hours
        // plus 2h buffer. If miles unknown, require at least 8h (minimum viable shift).
        const minHours = load.estimated_miles
          ? Math.ceil(load.estimated_miles / 55) + 2
          : 8;
        const hosEligible = drivers.filter((d) => d.hos_remaining_hours >= minHours);
        logger.log(
          `rank-drivers: ${hosEligible.length}/${drivers.length} drivers pass HOS filter (need ≥${minHours}h)`,
        );
        if (hosEligible.length === 0) {
          await prisma.load.update({
            where: { id: loadId },
            data: { needs_review: true },
          });
          return { skipped: 'no drivers with sufficient HOS' as const };
        }

        // Hard pre-filter 2: equipment — DRY_VAN and REEFER loads require a dry van
        // or reefer truck. FLATBED/STEP_DECK loads require flatbed/step-deck/lowboy.
        const DRY_CAPABLE = new Set(['DRY_VAN', 'REEFER', null]);
        const FLAT_CAPABLE = new Set(['FLATBED', 'STEP_DECK', 'LOWBOY', null]);
        const equipEligible = hosEligible.filter((d) => {
          if (!d.truck_type) return true; // no truck assigned → let Claude decide
          if (load.load_type === 'DRY_VAN' || load.load_type === 'REEFER') {
            return DRY_CAPABLE.has(d.truck_type);
          }
          if (load.load_type === 'FLATBED' || load.load_type === 'STEP_DECK') {
            return FLAT_CAPABLE.has(d.truck_type);
          }
          return true; // unknown load type — pass all
        });
        logger.log(
          `rank-drivers: ${equipEligible.length}/${hosEligible.length} drivers pass equipment filter`,
        );
        if (equipEligible.length === 0) {
          await prisma.load.update({
            where: { id: loadId },
            data: { needs_review: true },
          });
          return { skipped: 'no drivers with matching equipment' as const };
        }

        // Pre-compute deadhead miles for each driver (TypeScript — not Claude's job)
        const driversWithDeadhead = equipEligible.map((d) => ({
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
All drivers passed to you have already cleared HOS and equipment pre-filters in code.
Your job is to rank them by quality of fit.

Scoring 0-100:
  90-100 — perfect: close deadhead, ample HOS, exact equipment match
  70-89  — good: minor tradeoff (slightly more deadhead or lower HOS)
  50-69  — marginal: meaningful tradeoff but workable
  0-49   — poor fit (use only if no better option exists)

Rank by: 1) deadhead_miles (lower is better), 2) hos_remaining_hours (more is better),
3) truck type match to load_type.

reason must be plain language a dispatcher can read, ≤12 words.
recommendation_summary: ≤20 words on why the top driver is the best pick.

Return ONLY a rank_drivers tool call. Rank up to 5 drivers, best first.`;

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

      // Enrich Claude's output from TypeScript data — Claude only returns driver_id
      // and may omit deadhead_miles/eta_hours. Override with pre-computed values.
      // Done outside step.run so enrichedRanked is in scope for Step 4.
      const driverMap = new Map(drivers.map((d) => [d.id, d]));
      const enrichedRanked: RankDriversToolOutput = {
        ...ranked,
        ranked_drivers: ranked.ranked_drivers.map((r) => {
          const d = driverMap.get(r.driver_id);
          const deadheadMiles = d?.deadhead_miles ?? r.deadhead_miles ?? null;
          const etaHours =
            deadheadMiles != null ? Math.round((deadheadMiles / 55) * 10) / 10 : null;
          return {
            ...r,
            driver_name: d?.full_name ?? 'Unknown Driver',
            truck_id: d?.assigned_truck_id ?? null,
            truck_unit_number: d?.truck_unit_number ?? null,
            truck_type: d?.truck_type ?? null,
            deadhead_miles: deadheadMiles,
            eta_hours: etaHours,
          };
        }),
      };

      // ── Step 3: Persist results to AiTask + update load ───────────────────
      await step.run('save-rankings', async () => {
        // Fetch existing ai_score_details BEFORE the transaction to keep it short.
        // This avoids the 5s interactive transaction timeout on PgBouncer connections.
        const existing = await prisma.load.findFirst({
          where: { id: loadId, company_id: companyId },
          select: { ai_score_details: true },
        });
        const existingDetails =
          (existing?.ai_score_details as Record<string, unknown> | null) ?? {};

        await prisma.$transaction(
          [
            prisma.aiTask.create({
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
                output: enrichedRanked as unknown as Prisma.InputJsonValue,
                model: modelUsed,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                latency_ms: latencyMs,
                status: 'COMPLETED',
              },
            }),
            prisma.load.update({
              where: { id: loadId },
              data: {
                ai_score_details: {
                  ...existingDetails,
                  driver_rankings: enrichedRanked as unknown,
                  driver_rankings_at: new Date().toISOString(),
                } as unknown as Prisma.InputJsonValue,
              },
            }),
          ],
        );
      });

      // ── Step 4: Emit load/drivers-ranked event ────────────────────────────
      await step.sendEvent('notify-dispatch-ready', {
        name: 'load/drivers-ranked',
        data: {
          loadId,
          companyId,
          topDriverId: enrichedRanked.ranked_drivers[0]?.driver_id ?? null,
          topDriverName: enrichedRanked.ranked_drivers[0]?.driver_name ?? null,
          driverCount: enrichedRanked.ranked_drivers.length,
        },
      });

      logger.log(
        `Load ${loadId} driver rankings saved. Top: ${enrichedRanked.ranked_drivers[0]?.driver_name ?? 'none'}`,
      );
      return { loadId, rankedCount: enrichedRanked.ranked_drivers.length };
    },
  );
}
