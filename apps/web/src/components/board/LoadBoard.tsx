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

const COLUMN_ORDER: (keyof GroupedLoads)[] = [
  'PENDING',
  'SCORED',
  'ACCEPTED',
  'ASSIGNED',
  'AT_PICKUP',
  'LOADED',
  'EN_ROUTE',
  'DELIVERED',
];

const COLUMN_LABELS: Record<keyof GroupedLoads, string> = {
  PENDING: 'Pending',
  SCORED: 'Scored',
  ACCEPTED: 'Accepted',
  ASSIGNED: 'Assigned',
  AT_PICKUP: 'At Pickup',
  LOADED: 'Loaded',
  EN_ROUTE: 'En Route',
  DELIVERED: 'Delivered',
};

// Always show these columns even if empty
const ALWAYS_VISIBLE = new Set<keyof GroupedLoads>(['PENDING', 'SCORED', 'ACCEPTED', 'ASSIGNED', 'EN_ROUTE']);

function ColumnSkeleton({ label }: { label: string }) {
  return (
    <div className="flex w-56 shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <span className="h-4 w-6 animate-pulse rounded bg-gray-200" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-md bg-gray-200" />
      ))}
    </div>
  );
}

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
        // Realtime payloads lack joined relations (broker, assigned_driver).
        // Fetch the full list so cards render with complete data.
        fetch('/api/loads')
          .then((r) => r.ok ? r.json() : null)
          .then((data) => { if (data) mergeFreshLoads(data as Load[]); })
          .catch(() => {
            // Fallback: apply raw payload so at least status/score update.
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

  // When ?filter=needs_review, restrict every column to needs_review loads only
  const displayGrouped = useMemo(() => {
    if (!filterNeedsReview) return grouped;
    const filtered: typeof grouped = {} as typeof grouped;
    for (const key of COLUMN_ORDER) {
      filtered[key] = grouped[key].filter((l) => l.needs_review);
    }
    return filtered;
  }, [grouped, filterNeedsReview]);

  return (
    <div className="flex flex-col" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Needs-review banner — clears automatically when all NEEDS_REVIEW notifications resolve */}
      <NeedsReviewBanner notifications={notifications} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">
          Load Board
          {filterNeedsReview && (
            <span className="ml-2 text-xs font-normal text-amber-600">— needs review</span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: connected ? '#16a34a' : '#d97706' }}
          />
          <span className="text-xs text-gray-500">{connected ? 'Live' : 'Reconnecting…'}</span>
        </div>
      </div>

      {/* Stats bar */}
      <StatsBar stats={stats} isLoading={isStatsLoading} />

      {/* Columns */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-6 pt-2">
        {COLUMN_ORDER.map((key) => {
          const cards = displayGrouped[key];
          const isHideable = !ALWAYS_VISIBLE.has(key);
          if (isHideable && cards.length === 0) return null;

          return (
            <div key={key} className="flex w-56 shrink-0 flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {COLUMN_LABELS[key]}
                </span>
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                  {cards.length}
                </span>
              </div>
              {isStatsLoading && cards.length === 0
                ? [0, 1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-md bg-gray-200" />
                  ))
                : cards.map((load) => <LoadCard key={load.id} load={load} />)}
            </div>
          );
        })}

        {/* Show skeleton columns while stats are loading and no initial data */}
        {isStatsLoading && initialLoads.length === 0 &&
          COLUMN_ORDER.slice(0, 4).map((key) => (
            <ColumnSkeleton key={`skel-${key}`} label={COLUMN_LABELS[key]} />
          ))}
      </div>
    </div>
  );
}
