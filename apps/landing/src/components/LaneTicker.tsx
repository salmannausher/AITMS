const lanes = [
  { lane: 'CHI → DAL', rate: '$2,850', score: 'GOOD', color: 'var(--green)' },
  { lane: 'ATL → MIA', rate: '$1,640', score: 'GOOD', color: 'var(--green)' },
  { lane: 'NYC → BOS', rate: '$980', score: 'MARGINAL', color: '#FBBF24' },
  { lane: 'LAX → PHX', rate: '$1,120', score: 'GOOD', color: 'var(--green)' },
  { lane: 'SEA → PDX', rate: '$610', score: 'AVOID', color: 'var(--red)' },
  { lane: 'DEN → KC', rate: '$1,480', score: 'GOOD', color: 'var(--green)' },
  { lane: 'HOU → SA', rate: '$540', score: 'MARGINAL', color: '#FBBF24' },
  { lane: 'MEM → NSH', rate: '$720', score: 'GOOD', color: 'var(--green)' },
];

function TickerRow() {
  return (
    <>
      {lanes.map((l) => (
        <span key={l.lane} className="inline-flex items-center gap-3 px-6 font-mono text-sm whitespace-nowrap">
          <span style={{ color: 'var(--text)' }}>{l.lane}</span>
          <span style={{ color: 'var(--text-muted)' }}>{l.rate}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ color: l.color, background: 'color-mix(in srgb, currentColor 10%, transparent)', border: `1px solid color-mix(in srgb, ${l.color} 30%, transparent)` }}
          >
            {l.score}
          </span>
          <span style={{ color: 'var(--border-lit)' }}>·</span>
        </span>
      ))}
    </>
  );
}

export default function LaneTicker() {
  return (
    <div
      className="overflow-hidden py-3 border-y select-none"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      aria-hidden="true"
    >
      <div className="flex w-max animate-ticker">
        <TickerRow />
        <TickerRow />
      </div>
    </div>
  );
}
