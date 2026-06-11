import { Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { Prisma } from '@prisma/client';
import { carrierCostSettingsSchema } from '@aitms/shared';
import { inngest } from '../inngest/inngest.client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { EiaService } from './eia.service';
import { type LoadCreatedEventData } from './rate-analysis.types';

const logger = new Logger('RateAnalysisAgent');

interface ScoreToolOutput {
  score: 'GOOD' | 'MARGINAL' | 'AVOID';
  suggested_minimum_rate: number;
  counteroffer_rate: number | null;
  reason: string;
}

export function createScoreLoadFunction(
  prisma: PrismaService,
  anthropic: Anthropic,
  cache: CacheService,
  eia: EiaService,
) {
  return inngest.createFunction(
    {
      id: 'score-load',
      retries: 2,
      triggers: [{ event: 'load/created' as const }],
      onFailure: async ({
        event: failureEvent,
        error,
      }: {
        event: { data: { event: { data: LoadCreatedEventData } } };
        error: Error;
      }) => {
        const loadId = failureEvent.data?.event?.data?.loadId ?? 'unknown';
        logger.error('score-load failed', { loadId, error: error.message });

        try {
          const existing = await prisma.aiTask.findFirst({
            where: { entity_id: loadId, agent: 'rate_analysis' },
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
      const { loadId, companyId } = event.data as LoadCreatedEventData;

      // ── Step 1: Fetch all context ───────────────────────────────────────────
      const context = await step.run('fetch-context', async () => {
        // 1a. Load
        const load = await prisma.load.findUnique({ where: { id: loadId } });

        if (!load) return { skipped: 'load not found' as const };
        if (load.status !== 'PENDING') return { skipped: 'already processed' as const };

        // 1b. Guard: no rate
        if (load.rate == null) {
          await prisma.load.update({
            where: { id: loadId },
            data: { needs_review: true },
          });
          await prisma.aiTask.create({
            data: {
              company_id: companyId,
              agent: 'rate_analysis',
              task_type: 'score_load',
              entity_type: 'load',
              entity_id: loadId,
              input: { loadId },
              output: { skipped: 'no rate on load' },
              model: 'none',
              status: 'COMPLETED',
            },
          });
          return { skipped: 'no rate' as const };
        }

        // 1c. Cost settings — cache-aside TTL 300s
        const costCacheKey = `company:${companyId}:settings`;
        let costs = await cache.get<unknown>(costCacheKey);
        if (!costs) {
          const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { settings: true },
          });
          const raw = (company?.settings as Record<string, unknown>)?.['costs'];
          await cache.set(costCacheKey, raw ?? null, 300);
          costs = raw ?? null;
        }

        const costsResult = carrierCostSettingsSchema.safeParse(costs);
        if (!costsResult.success) {
          await prisma.load.update({
            where: { id: loadId },
            data: { needs_review: true },
          });
          await prisma.aiTask.create({
            data: {
              company_id: companyId,
              agent: 'rate_analysis',
              task_type: 'score_load',
              entity_type: 'load',
              entity_id: loadId,
              input: { loadId },
              output: { skipped: 'no cost settings' },
              model: 'none',
              status: 'COMPLETED',
            },
          });
          return { skipped: 'no settings' as const };
        }

        const validCosts = costsResult.data;

        // 1d. Lane history — cache-aside TTL 3600s
        const laneKey = `lane:${load.origin_state}:${load.dest_state}:${companyId}`;
        let laneHistory = await cache.get<{
          count: number;
          avgRpm: number | null;
          minRpm: number | null;
          maxRpm: number | null;
        }>(laneKey);

        if (!laneHistory) {
          const recentLoads = await prisma.load.findMany({
            where: {
              company_id: companyId,
              origin_state: load.origin_state,
              dest_state: load.dest_state,
              rpm: { not: null },
              deleted_at: null,
              id: { not: loadId },
            },
            select: { rpm: true },
            orderBy: { created_at: 'desc' },
            take: 30,
          });

          const rpms = recentLoads.map((l) => Number(l.rpm));
          const count = rpms.length;
          laneHistory = {
            count,
            avgRpm: count > 0 ? Number((rpms.reduce((a, b) => a + b, 0) / count).toFixed(4)) : null,
            minRpm: count > 0 ? Number(Math.min(...rpms).toFixed(4)) : null,
            maxRpm: count > 0 ? Number(Math.max(...rpms).toFixed(4)) : null,
          };
          await cache.set(laneKey, laneHistory, 3600);
        }

        // 1e. Diesel price
        const dieselPricePerGallon = await eia.getDieselPrice(cache);

        // 1f. Deterministic math — ground truth for Claude
        const rate = Number(load.rate);
        const rpm = load.rpm != null
          ? Number(load.rpm)
          : load.estimated_miles
            ? Number((rate / load.estimated_miles).toFixed(4))
            : null;

        const allInCostPerMile = Number(
          (validCosts.cost_per_mile + validCosts.fuel_cost_per_mile + validCosts.driver_pay_per_mile).toFixed(4),
        );
        const estimatedProfit = load.estimated_miles
          ? Number((rate - allInCostPerMile * load.estimated_miles).toFixed(2))
          : null;

        return {
          load,
          costs: validCosts,
          laneHistory,
          dieselPricePerGallon,
          computed: {
            allInCostPerMile,
            breakEvenRpm: allInCostPerMile,
            estimatedProfit,
            rpm,
          },
        };
      });

      // Early-exit guards
      if ('skipped' in context) {
        logger.warn(`score-load skipped for load ${loadId}: ${context.skipped}`);
        return { loadId, skipped: context.skipped };
      }

      const { load, costs, laneHistory, dieselPricePerGallon, computed } = context;

      // ── Step 2: Claude scores the load ─────────────────────────────────────
      const { scored, inputTokens, outputTokens, modelUsed, latencyMs } = await step.run(
        'claude-score',
        async () => {
          const userMessage = JSON.stringify({
            lane: `${load.origin_state} → ${load.dest_state}`,
            pickup_date: String(load.pickup_date).slice(0, 10),
            load_type: load.load_type ?? 'unknown',
            rate_usd: Number(load.rate),
            minimum_rpm: costs.minimum_rpm,
            diesel_price_per_gallon: dieselPricePerGallon,
            computed,
            lane_history_last_30: laneHistory,
          });

          const startMs = Date.now();

          const response = await anthropic.messages.create({
            model: 'claude-haiku-4-5',
            max_tokens: 512,
            temperature: 0,
            system: `You are a freight rate analyst for a trucking carrier.
All financial math has been computed for you — treat the numbers as ground truth.
Your job is the judgment call only. Be conservative: when in doubt, score MARGINAL.

Scoring guidance:
  GOOD     — rpm clearly above minimum_rpm AND above lane average (when history exists)
  MARGINAL — rpm within ±10% of minimum_rpm, or below lane average, or thin history (<3 loads)
  AVOID    — rpm below break_even_rpm, or negative estimated_profit_usd

reason must be plain language a dispatcher can read, 12 words max.
suggested_minimum_rate is the walk-away total in USD (at minimum, covers break-even).
counteroffer_rate: non-null only when score is MARGINAL — target ~8% above offered rate.

Return ONLY a score_load tool call. No commentary.`,
            tools: [
              {
                name: 'score_load',
                description: 'Record the scoring decision for this load',
                input_schema: {
                  type: 'object' as const,
                  required: ['score', 'suggested_minimum_rate', 'counteroffer_rate', 'reason'],
                  properties: {
                    score: {
                      type: 'string' as const,
                      enum: ['GOOD', 'MARGINAL', 'AVOID'],
                    },
                    suggested_minimum_rate: {
                      type: 'number' as const,
                      description: 'Walk-away total rate in USD',
                    },
                    counteroffer_rate: {
                      type: ['number', 'null'] as unknown as 'number',
                      description: 'Non-null only when MARGINAL; ~8% above offered rate',
                    },
                    reason: {
                      type: 'string' as const,
                      description: 'Plain language for dispatcher, max 12 words',
                    },
                  },
                },
              },
            ],
            tool_choice: { type: 'tool', name: 'score_load' },
            messages: [{ role: 'user', content: userMessage }],
          });

          const latencyMs = Date.now() - startMs;

          const toolUse = response.content.find((b) => b.type === 'tool_use');
          if (!toolUse || toolUse.type !== 'tool_use') {
            throw new Error('No tool_use block in Claude response');
          }

          return {
            scored: toolUse.input as ScoreToolOutput,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            modelUsed: response.model,
            latencyMs,
          };
        },
      );

      // ── Step 3: Persist score ───────────────────────────────────────────────
      await step.run('save-score', async () => {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const updated = await tx.load.updateMany({
            where: { id: loadId, status: 'PENDING' },
            data: {
              ai_score: scored.score,
              ai_score_details: {
                ...scored,
                computed,
                laneHistory,
                dieselPricePerGallon,
                scored_at: new Date().toISOString(),
              } as Prisma.InputJsonValue,
              status: 'SCORED',
            },
          });

          if (updated.count === 0) {
            logger.warn(`score-load: load ${loadId} was already processed — skipping AiTask write`);
            return;
          }

          await tx.aiTask.create({
            data: {
              company_id: companyId,
              agent: 'rate_analysis',
              task_type: 'score_load',
              entity_type: 'load',
              entity_id: loadId,
              input: {
                lane: `${load.origin_state}→${load.dest_state}`,
                rate: Number(load.rate),
                rpm: computed.rpm,
                allInCostPerMile: computed.allInCostPerMile,
                laneHistoryCount: laneHistory.count,
              },
              output: scored as unknown as Prisma.InputJsonValue,
              model: modelUsed,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              latency_ms: latencyMs,
              status: 'COMPLETED',
            },
          });
        });
      });

      // ── Step 4: Fire load/scored event ─────────────────────────────────────
      await step.sendEvent('notify-scored', {
        name: 'load/scored',
        data: { loadId, companyId, score: scored.score },
      });

      logger.log(`Load ${loadId} scored ${scored.score}: ${scored.reason}`);
      return { loadId, score: scored.score };
    },
  );
}
