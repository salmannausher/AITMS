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

const SCORE_CONFIG = {
  GOOD: { label: 'GOOD MARGIN', bg: 'bg-emerald-100', color: 'text-emerald-800' },
  MARGINAL: { label: 'MARGINAL', bg: 'bg-amber-100', color: 'text-amber-800' },
  AVOID: { label: 'AVOID', bg: 'bg-red-100', color: 'text-red-800' },
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function SegmentedRpmBar({ offered, breakEven }: { offered: number; breakEven: number }) {
  const max = Math.max(offered, breakEven) * 1.3;
  const offeredPct = Math.min((offered / max) * 100, 100);
  const breakEvenPct = Math.min((breakEven / max) * 100, 100);
  const surplusPct = offeredPct - breakEvenPct;

  return (
    <div>
      <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        <span>Offered: ${offered.toFixed(2)}/mi</span>
        <span>Break-even: ${breakEven.toFixed(2)}/mi</span>
      </div>
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
        {/* break-even segment */}
        <div className="h-full bg-primary/30" style={{ width: `${breakEvenPct}%` }} />
        {/* surplus segment */}
        {surplusPct > 0 && (
          <div className="h-full bg-primary" style={{ width: `${surplusPct}%` }} />
        )}
      </div>
    </div>
  );
}

function Panel({ details }: { details: AiScoreDetails }) {
  if (!details) {
    return <p className="text-sm text-muted-foreground">This load has not been scored yet.</p>;
  }

  const scoreConf = details.score != null ? SCORE_CONFIG[details.score as keyof typeof SCORE_CONFIG] : null;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground leading-relaxed">
          {details.reason ?? 'No scoring reason available.'}
        </p>
        {scoreConf && (
          <span className={`shrink-0 rounded-lg px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${scoreConf.bg} ${scoreConf.color}`}>
            {scoreConf.label}
          </span>
        )}
      </div>

      {/* RPM bar */}
      {details.computed?.rpm != null && details.computed?.breakEvenRpm != null && (
        <SegmentedRpmBar offered={details.computed.rpm} breakEven={details.computed.breakEvenRpm} />
      )}

      {/* Profit + min rate cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Est. Profit</p>
          <p className="font-mono-data text-2xl font-semibold text-primary">
            {details.computed?.estimatedProfit != null
              ? `$${fmt(details.computed.estimatedProfit)}`
              : '—'}
          </p>
        </div>
        {details.suggested_minimum_rate != null && (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Suggested Min Rate</p>
            <p className="font-mono-data text-2xl font-semibold text-foreground">
              ${fmt(details.suggested_minimum_rate)}
            </p>
          </div>
        )}
      </div>

      {/* Lane history footnote */}
      {details.laneHistory && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          Based on {details.laneHistory.count} load{details.laneHistory.count !== 1 ? 's' : ''} on this lane
          {details.laneHistory.avgRpm != null && `, avg $${details.laneHistory.avgRpm.toFixed(2)}/mi`}.
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
    <div className="rounded-xl border border-primary/20 bg-accent/30 p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary shrink-0"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/><path d="M12 16v-4M12 8h.01"/></svg>
        <h3 className="font-display text-sm font-semibold text-foreground">AI Analysis</h3>
      </div>
      {result.success ? (
        <Panel details={result.data} />
      ) : (
        <p className="text-sm text-muted-foreground">Scoring data unavailable.</p>
      )}
    </div>
  );
}
