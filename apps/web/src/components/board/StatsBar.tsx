import type { LoadStats } from '@/hooks/useLoads';

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm">
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function StatChipSkeleton() {
  return (
    <div className="h-8 w-36 animate-pulse rounded-md bg-gray-200" />
  );
}

interface StatsBarProps {
  stats: LoadStats | null;
  isLoading: boolean;
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  if (isLoading || !stats) {
    return (
      <div className="flex gap-3 px-4 py-3">
        <StatChipSkeleton />
        <StatChipSkeleton />
        <StatChipSkeleton />
        <StatChipSkeleton />
      </div>
    );
  }

  const avgRpm =
    stats.todays_avg_rpm !== null
      ? `$${stats.todays_avg_rpm.toFixed(2)}`
      : '—';

  return (
    <div className="flex flex-wrap gap-3 px-4 py-3">
      <StatChip label="Active Loads" value={String(stats.total_active)} />
      <StatChip label="Need Assignment" value={String(stats.needs_assignment)} />
      <StatChip label="Drivers Available" value={String(stats.drivers_available)} />
      <StatChip label="Avg RPM Today" value={avgRpm} />
    </div>
  );
}
