import { useRouter } from 'next/navigation';
import type { Load } from '@/hooks/useLoads';

const SCORE_STYLES = {
  GOOD: { label: 'GOOD', bg: '#dcfce7', color: '#16a34a' },
  MARGINAL: { label: 'MARGINAL', bg: '#fef3c7', color: '#b45309' },
  AVOID: { label: 'AVOID', bg: '#fee2e2', color: '#b91c1c' },
  null: { label: 'Scoring...', bg: '#f3f4f6', color: '#6b7280' },
} as const;

function getScoreStyle(score: Load['ai_score']) {
  return SCORE_STYLES[score ?? 'null'];
}

function getAiReason(details: unknown): string | null {
  if (!details || typeof details !== 'object') return null;
  const d = details as Record<string, unknown>;
  if (typeof d['reason'] === 'string') {
    const words = d['reason'].split(' ');
    return words.length > 12 ? words.slice(0, 12).join(' ') + '…' : d['reason'];
  }
  return null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRate(rate: string | null) {
  if (!rate) return '—';
  return `$${Number(rate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatRpm(rpm: string | null) {
  if (!rpm) return null;
  return `$${Number(rpm).toFixed(2)}/mi`;
}

export function LoadCard({ load }: { load: Load }) {
  const router = useRouter();
  const scoreStyle = getScoreStyle(load.ai_score);
  const reason = getAiReason(load.ai_score_details);

  return (
    <div
      onClick={() => router.push(`/loads/${load.id}`)}
      className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow-md transition-shadow"
      style={{ minHeight: '80px' }}
    >
      {/* Row 1 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 truncate">
          {load.origin_city}, {load.origin_state} → {load.dest_city}, {load.dest_state}
        </span>
        <span className="ml-2 shrink-0 text-xs text-gray-400">{formatDate(load.pickup_date)}</span>
      </div>

      {/* Row 2 */}
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-xs text-gray-700">
          {formatRate(load.rate)}
          {load.rpm ? <span className="text-gray-400"> · {formatRpm(load.rpm)}</span> : null}
        </span>
        <span
          className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: scoreStyle.bg, color: scoreStyle.color }}
        >
          {scoreStyle.label}
        </span>
      </div>

      {/* Row 3 */}
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[11px] text-gray-400 truncate">{load.broker?.name ?? '—'}</span>
        <span className="ml-2 shrink-0 text-[11px] text-gray-400">
          {load.assigned_driver?.full_name ?? 'Unassigned'}
        </span>
      </div>

      {/* Row 4 — AI reason */}
      {reason && (
        <div className="mt-0.5 text-[11px] italic text-gray-400 truncate">{reason}</div>
      )}
    </div>
  );
}
