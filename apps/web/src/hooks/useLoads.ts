'use client';

import { useEffect, useMemo, useState } from 'react';

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
  rate: string | null;
  rpm: string | null;
  estimated_miles: number | null;
  status: LoadStatusValue;
  needs_review: boolean;
  ai_score: 'GOOD' | 'MARGINAL' | 'AVOID' | null;
  ai_score_details: unknown;
  broker: LoadBroker | null;
  assigned_driver: LoadDriver | null;
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
      .then((r) => r.json())
      .then((data) => setStats(data as LoadStats))
      .catch(() => setError('Failed to load stats'))
      .finally(() => setIsStatsLoading(false));
  }, []);

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

  return { loads, setLoads, stats, isStatsLoading, grouped, error };
}
