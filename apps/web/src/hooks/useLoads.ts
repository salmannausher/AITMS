'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface LoadBroker {
  id: string;
  name: string;
}

export interface LoadDriver {
  id: string;
  full_name: string;
}

export type LoadStatusValue =
  | 'PENDING'
  | 'SCORED'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'AT_PICKUP'
  | 'LOADED'
  | 'EN_ROUTE'
  | 'DELIVERED'
  | 'INVOICED'
  | 'PAID'
  | 'CANCELLED';

export interface Load {
  id: string;
  company_id: string;
  origin_city: string;
  origin_state: string;
  dest_city: string;
  dest_state: string;
  pickup_date: string;
  delivery_date: string | null;
  rate: string | null;
  rpm: string | null;
  estimated_miles: number | null;
  weight: number | null;
  load_type: string | null;
  reference_number: string | null;
  status: LoadStatusValue;
  needs_review: boolean;
  ai_score: 'GOOD' | 'MARGINAL' | 'AVOID' | null;
  ai_score_details: unknown;
  broker: LoadBroker | null;
  assigned_driver: LoadDriver | null;
  driver_confirmed_at: string | null;
  driver_declined_at: string | null;
}

export interface LoadStats {
  total_active: number;
  needs_assignment: number;
  drivers_available: number;
  todays_avg_rpm: number | null;
}

export type GroupedLoads = Record<
  'PENDING' | 'SCORED' | 'ACCEPTED' | 'ASSIGNED' | 'AT_PICKUP' | 'LOADED' | 'EN_ROUTE' | 'DELIVERED',
  Load[]
>;

export function useLoads(initialLoads: Load[]) {
  const [loads, setLoads] = useState<Load[]>(initialLoads);
  const [stats, setStats] = useState<LoadStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/loads/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStats(data as LoadStats); })
      .catch(() => setError('Failed to load stats'))
      .finally(() => setIsStatsLoading(false));
  }, []);

  // Merge fresh loads from API into current state — updates existing cards
  // (score, status, ai_score) and adds any new loads Realtime may have missed.
  const mergeFreshLoads = useCallback((fresh: Load[]) => {
    setLoads((prev) => {
      const map = new Map(prev.map((l) => [l.id, l]));
      for (const l of fresh) map.set(l.id, l);
      return Array.from(map.values());
    });
  }, []);

  // Polling fallback: when PENDING or ACCEPTED loads exist (scoring/ranking in
  // flight), refetch every 8s so score badges and status moves appear without
  // needing a manual reload. Stops when no loads are in those states.
  const loadsRef = useRef(loads);
  useEffect(() => { loadsRef.current = loads; }, [loads]);

  useEffect(() => {
    const shouldPoll = () =>
      loadsRef.current.some((l) => l.status === 'PENDING' || l.status === 'ACCEPTED');

    if (!shouldPoll()) return;

    const timer = setInterval(() => {
      if (!shouldPoll()) return;
      fetch('/api/loads')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) mergeFreshLoads(data as Load[]); })
        .catch(() => { /* ignore — stale data is fine */ });
    }, 8000);

    return () => clearInterval(timer);
  }, [loads, mergeFreshLoads]);

  const grouped = useMemo<GroupedLoads>(
    () => ({
      PENDING: loads.filter((l) => l.status === 'PENDING'),
      SCORED: loads.filter((l) => l.status === 'SCORED'),
      ACCEPTED: loads.filter((l) => l.status === 'ACCEPTED'),
      ASSIGNED: loads.filter((l) => l.status === 'ASSIGNED'),
      AT_PICKUP: loads.filter((l) => l.status === 'AT_PICKUP'),
      LOADED: loads.filter((l) => l.status === 'LOADED'),
      EN_ROUTE: loads.filter((l) => l.status === 'EN_ROUTE'),
      DELIVERED: loads.filter((l) => l.status === 'DELIVERED'),
    }),
    [loads],
  );

  return { loads, setLoads, mergeFreshLoads, stats, isStatsLoading, grouped, error };
}
