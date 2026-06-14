import type { LoadStats } from '@/hooks/useLoads';

const STATS_CONFIG = [
  {
    key: 'total_active' as const,
    label: 'Active Loads',
    format: (v: number) => String(v),
    iconColor: '#003d9b',
    iconBg: '#e8f0fe',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
  },
  {
    key: 'needs_assignment' as const,
    label: 'Need Assignment',
    format: (v: number) => String(v),
    iconColor: '#d97706',
    iconBg: '#fef3c7',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    key: 'drivers_available' as const,
    label: 'Drivers Ready',
    format: (v: number) => String(v),
    iconColor: '#059669',
    iconBg: '#d1fae5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: 'todays_avg_rpm' as const,
    label: 'Avg RPM Today',
    format: (v: number | null) => v !== null ? `$${v.toFixed(2)}` : '—',
    iconColor: '#003d9b',
    iconBg: '#e8f0fe',
    mono: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
];

function StatCard({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  mono?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 flex-1 min-w-[160px]"
      style={{ border: '1px solid #e8eaf0', boxShadow: '0 1px 3px rgba(5,26,62,0.04)' }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <div>
        <div
          className={`text-2xl font-bold leading-none ${mono ? 'font-mono-data' : 'font-display'}`}
          style={{ color: '#051a3e' }}
        >
          {value}
        </div>
        <div className="mt-1 text-xs" style={{ color: '#64748b' }}>{label}</div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div
      className="flex-1 min-w-[160px] h-[76px] animate-pulse rounded-xl"
      style={{ backgroundColor: '#f1f3f9' }}
    />
  );
}

interface StatsBarProps {
  stats: LoadStats | null;
  isLoading: boolean;
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  if (isLoading || !stats) {
    return (
      <div className="flex gap-3 px-5 py-4">
        {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 px-5 py-4">
      {STATS_CONFIG.map(({ key, label, format, icon, iconColor, iconBg, mono }) => (
        <StatCard
          key={key}
          label={label}
          value={format(stats[key] as never)}
          icon={icon}
          iconColor={iconColor}
          iconBg={iconBg}
          mono={mono}
        />
      ))}
    </div>
  );
}
