import { z } from 'zod';

const aiScoreDetailsSchema = z
  .object({
    score: z.enum(['GOOD', 'MARGINAL', 'AVOID']).optional(),
    suggested_minimum_rate: z.number().optional(),
    counteroffer_rate: z.number().nullable().optional(),
    reason: z.string().optional(),
    computed: z
      .object({
        allInCostPerMile: z.number(),
        breakEvenRpm: z.number(),
        estimatedProfit: z.number().nullable(),
        rpm: z.number().nullable(),
      })
      .optional(),
    laneHistory: z
      .object({
        count: z.number(),
        avgRpm: z.number().nullable(),
      })
      .optional(),
  })
  .nullable();

type AiScoreDetails = z.infer<typeof aiScoreDetailsSchema>;

const SCORE_STYLES = {
  GOOD: { bg: '#dcfce7', color: '#16a34a' },
  MARGINAL: { bg: '#fef3c7', color: '#b45309' },
  AVOID: { bg: '#fee2e2', color: '#b91c1c' },
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function RpmBar({ offered, breakEven }: { offered: number; breakEven: number }) {
  const max = Math.max(offered, breakEven) * 1.3;
  const offeredPct = Math.min((offered / max) * 100, 100);
  const breakEvenPct = Math.min((breakEven / max) * 100, 100);

  return (
    <div className="mt-1">
      <div className="relative h-3 w-full rounded-full bg-gray-100">
        <div
          className="absolute left-0 top-0 h-3 rounded-full bg-blue-500"
          style={{ width: `${offeredPct}%` }}
        />
        <div
          className="absolute top-0 h-3 w-0.5 bg-red-400"
          style={{ left: `${breakEvenPct}%` }}
          title={`Break-even: $${breakEven.toFixed(2)}/mi`}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] text-gray-400">
        <span>Offered: ${offered.toFixed(2)}/mi</span>
        <span>Break-even: ${breakEven.toFixed(2)}/mi</span>
      </div>
    </div>
  );
}

function Panel({ details }: { details: AiScoreDetails }) {
  if (!details) {
    return <p className="text-sm text-gray-500">This load has not been scored yet.</p>;
  }

  const scoreStyle = details.score != null ? SCORE_STYLES[details.score as keyof typeof SCORE_STYLES] : null;

  return (
    <div className="space-y-3">
      {/* Score + reason */}
      <div className="flex items-start gap-3">
        {scoreStyle && details.score && (
          <span
            className="shrink-0 rounded px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.color }}
          >
            {details.score}
          </span>
        )}
        {details.reason && (
          <p className="text-sm text-gray-700">{details.reason}</p>
        )}
      </div>

      {/* RPM bar */}
      {details.computed?.rpm != null && details.computed?.breakEvenRpm != null && (
        <RpmBar offered={details.computed.rpm} breakEven={details.computed.breakEvenRpm} />
      )}

      {/* Profit + rates */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-gray-500">Est. Profit</dt>
        <dd className="font-medium text-gray-900">
          {details.computed?.estimatedProfit != null
            ? `$${fmt(details.computed.estimatedProfit)}`
            : 'Rate not set'}
        </dd>

        {details.suggested_minimum_rate != null && (
          <>
            <dt className="text-gray-500">Suggested Min Rate</dt>
            <dd className="font-medium text-gray-900">${fmt(details.suggested_minimum_rate)}</dd>
          </>
        )}

        {details.counteroffer_rate != null && (
          <>
            <dt className="text-gray-500">Counteroffer Rate</dt>
            <dd className="font-medium text-amber-700">${fmt(details.counteroffer_rate)}</dd>
          </>
        )}
      </dl>

      {/* Lane history */}
      {details.laneHistory && (
        <p className="text-xs text-gray-400">
          {details.laneHistory.count} load{details.laneHistory.count !== 1 ? 's' : ''} on this
          lane
          {details.laneHistory.avgRpm != null
            ? `, avg $${details.laneHistory.avgRpm.toFixed(2)}/mi`
            : ''}
        </p>
      )}
    </div>
  );
}

interface AiAnalysisPanelProps {
  details: unknown;
  rate: string | null;
}

export function AiAnalysisPanel({ details }: AiAnalysisPanelProps) {
  const result = aiScoreDetailsSchema.safeParse(details);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">AI Analysis</h3>
      {result.success ? (
        <Panel details={result.data} />
      ) : (
        <p className="text-sm text-gray-400">Scoring data unavailable.</p>
      )}
    </div>
  );
}
