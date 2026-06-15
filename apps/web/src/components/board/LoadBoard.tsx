'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useLoads, type Load, type GroupedLoads } from '@/hooks/useLoads';
import { useLoadsBoardRealtime } from '@/hooks/useLoadsBoardRealtime';
import { useNotifications } from '@/hooks/useNotifications';
import { NeedsReviewBanner } from '@/components/notifications/NeedsReviewBanner';
import { LoadCard } from './LoadCard';
import { StatsBar } from './StatsBar';
import { LoadBoardMobile } from './LoadBoardMobile';

const COLUMN_ORDER: (keyof GroupedLoads)[] = [
  'PENDING',
  'SCORED',
  'ACCEPTED',
  'ASSIGNED',
  'EN_ROUTE',
];

type ColMeta = {
  label: string;
  headerColor: string;
  countBg: string;
  countColor: string;
  colBg: string;
  colBorder: string;
  colGlow?: string;
  icon?: React.ReactNode;
};

const COLUMN_META: Record<keyof GroupedLoads, ColMeta> = {
  PENDING: {
    label: 'Pending',
    headerColor: '#64748b',
    countBg: '#f1f5f9',
    countColor: '#64748b',
    colBg: '#f8fafc',
    colBorder: '#e2e8f0',
  },
  SCORED: {
    label: 'Scored',
    headerColor: '#5e4db9',
    countBg: '#ede9ff',
    countColor: '#5e4db9',
    colBg: '#f5f3ff',
    colBorder: '#c4b5fd',
    colGlow: '0 0 12px rgba(159,142,255,0.3)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#5e4db9">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
    ),
  },
  ACCEPTED: {
    label: 'Accepted',
    headerColor: '#003d9b',
    countBg: '#dbeafe',
    countColor: '#003d9b',
    colBg: '#f8faff',
    colBorder: '#bfdbfe',
  },
  ASSIGNED: {
    label: 'Assigned',
    headerColor: '#1d4ed8',
    countBg: '#eff6ff',
    countColor: '#1d4ed8',
    colBg: '#f8faff',
    colBorder: '#bfdbfe',
  },
  AT_PICKUP: {
    label: 'At Pickup',
    headerColor: '#d97706',
    countBg: '#fef3c7',
    countColor: '#d97706',
    colBg: '#fffbeb',
    colBorder: '#fde68a',
  },
  LOADED: {
    label: 'Loaded',
    headerColor: '#d97706',
    countBg: '#fef3c7',
    countColor: '#d97706',
    colBg: '#fffbeb',
    colBorder: '#fde68a',
  },
  EN_ROUTE: {
    label: 'En Route',
    headerColor: '#004b59',
    countBg: '#ccfbf1',
    countColor: '#004b59',
    colBg: '#f0fdfa',
    colBorder: '#99f6e4',
  },
  DELIVERED: {
    label: 'Delivered',
    headerColor: '#059669',
    countBg: '#d1fae5',
    countColor: '#059669',
    colBg: '#f0fdf4',
    colBorder: '#bbf7d0',
  },
};

const ALWAYS_VISIBLE = new Set<keyof GroupedLoads>(['PENDING', 'SCORED', 'ACCEPTED', 'ASSIGNED', 'EN_ROUTE']);

interface LoadBoardProps {
  initialLoads: Load[];
  companyId: string;
}

export function LoadBoard({ initialLoads, companyId }: LoadBoardProps) {
  const { loads, setLoads, mergeFreshLoads, stats, isStatsLoading, grouped } = useLoads(initialLoads);
  const { notifications, onLoadEvent } = useNotifications(companyId);
  const searchParams = useSearchParams();
  const filterNeedsReview = searchParams.get('filter') === 'needs_review';

  const handleLoadChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Load>) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        fetch('/api/loads')
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data) mergeFreshLoads(data as Load[]); })
          .catch(() => {
            if (payload.eventType === 'INSERT') {
              setLoads((prev) => [...prev, payload.new]);
            } else {
              setLoads((prev) =>
                prev.map((l) => (l.id === payload.new.id ? { ...l, ...payload.new } : l)),
              );
            }
          });
      } else if (payload.eventType === 'DELETE') {
        setLoads((prev) => prev.filter((l) => l.id !== payload.old.id));
      }
    },
    [setLoads, mergeFreshLoads],
  );

  const { connected } = useLoadsBoardRealtime(companyId, handleLoadChange, onLoadEvent);

  const displayGrouped = useMemo(() => {
    if (!filterNeedsReview) return grouped;
    const filtered: typeof grouped = {} as typeof grouped;
    for (const key of COLUMN_ORDER) {
      filtered[key] = grouped[key].filter((l) => l.needs_review);
    }
    return filtered;
  }, [grouped, filterNeedsReview]);

  return (
    <>
      {/* Mobile layout */}
      <div className="block lg:hidden">
        <LoadBoardMobile initialLoads={initialLoads} companyId={companyId} />
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:flex-col lg:min-h-full" style={{ backgroundColor: '#faf9ff' }}>
      <NeedsReviewBanner notifications={notifications} />

      {/* Page header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b" style={{ borderColor: '#e8eaf0' }}>
        <div>
          <h1 className="font-display text-lg font-bold" style={{ color: '#051a3e' }}>
            Logistics OS
            {filterNeedsReview && (
              <span className="ml-2 text-sm font-normal" style={{ color: '#d97706' }}>— needs review</span>
            )}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Load Board · Operational Center</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: connected ? '#059669' : '#d97706' }} />
          <span className="text-xs" style={{ color: '#64748b' }}>{connected ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} isLoading={isStatsLoading} />

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto px-5 pb-8 pt-1">
        {COLUMN_ORDER.map((key) => {
          const cards = displayGrouped[key];
          if (!ALWAYS_VISIBLE.has(key) && cards.length === 0) return null;

          const meta = COLUMN_META[key];

          return (
            <div key={key} className="flex w-64 shrink-0 flex-col gap-2">
              {/* Column header */}
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{
                  backgroundColor: meta.colBg,
                  border: `1px solid ${meta.colBorder}`,
                  boxShadow: meta.colGlow,
                }}
              >
                <div className="flex items-center gap-1.5">
                  {meta.icon}
                  <span className="font-display text-[13px] font-bold" style={{ color: meta.headerColor }}>
                    {meta.label}
                  </span>
                </div>
                <span
                  className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                  style={{ backgroundColor: meta.countBg, color: meta.countColor }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Card stack */}
              <div
                className="flex flex-col gap-2.5 rounded-xl p-2 min-h-[100px]"
                style={{
                  backgroundColor: meta.colBg,
                  border: `1px solid ${meta.colBorder}`,
                  boxShadow: meta.colGlow,
                }}
              >
                {isStatsLoading && cards.length === 0 ? (
                  [0, 1].map((i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: '#e8eaf0' }} />
                  ))
                ) : cards.length === 0 ? (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-xs" style={{ color: '#94a3b8' }}>No loads</p>
                  </div>
                ) : (
                  cards.map((load) => <LoadCard key={load.id} load={load} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
}
