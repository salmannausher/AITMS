'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AiAnalysisPanel } from '@/components/loads/AiAnalysisPanel';
import { DriverRecommendations } from '@/components/loads/DriverRecommendations';
import { DispatchRecommendationsPanel } from '@/components/loads/DispatchRecommendationsPanel';
import { StatusProgressionPanel } from '@/components/loads/StatusProgressionPanel';
import { ActionBar } from '@/components/loads/ActionBar';
import { EventTimeline } from '@/components/loads/EventTimeline';
import { MessagesTab } from '@/components/loads/MessagesTab';
import { useLoadDetailRealtime } from '@/hooks/useLoadDetailRealtime';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { LoadDetail as LoadDetailType } from '@/components/loads/types';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

function fmt(n: string | null) {
  if (!n) return null;
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtRpm(n: string | null) {
  if (!n) return null;
  return `$${Number(n).toFixed(2)}/mi`;
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LoadDetail({ load: initialLoad, currentUserId }: { load: LoadDetailType; currentUserId: string }) {
  const [load, setLoad] = useState(initialLoad);

  const refetch = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loads/${initialLoad.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (res.ok) setLoad(await res.json() as LoadDetailType);
    } catch {
      // silently ignore — stale data is better than a crash
    }
  }, [initialLoad.id]);

  useLoadDetailRealtime(initialLoad.id, initialLoad.company_id, refetch);

  // Polling fallback: when load is ACCEPTED and driver rankings haven't arrived yet,
  // poll every 5s (up to 90s) in case Supabase Realtime misses the row update.
  const pollCountRef = useRef(0);
  useEffect(() => {
    const hasRankings = !!(load.ai_score_details as Record<string, unknown> | null)?.['driver_rankings'];
    if (load.status !== 'ACCEPTED' || hasRankings) {
      pollCountRef.current = 0;
      return;
    }
    pollCountRef.current = 0;
    const timer = setInterval(() => {
      pollCountRef.current += 1;
      if (pollCountRef.current > 18) {
        clearInterval(timer);
        return;
      }
      void refetch();
    }, 5000);
    return () => clearInterval(timer);
  }, [load.status, load.ai_score_details, refetch]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          {load.origin_city}, {load.origin_state} → {load.dest_city}, {load.dest_state}
        </h1>
        <span className="text-xs text-gray-400 font-mono">{load.status}</span>
      </div>

      {/* Summary grid */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Field label="Pickup Date" value={fmtDate(load.pickup_date)} />
          <Field label="Delivery Date" value={fmtDate(load.delivery_date)} />
          <Field label="Load Type" value={load.load_type} />
          <Field label="Rate" value={fmt(load.rate)} />
          <Field label="RPM" value={fmtRpm(load.rpm)} />
          <Field label="Miles" value={load.estimated_miles?.toLocaleString() ?? null} />
          <Field label="Weight" value={load.weight ? `${load.weight.toLocaleString()} lbs` : null} />
          <Field label="Commodity" value={load.commodity} />
          <Field label="Ref #" value={load.reference_number} />
          <Field label="Broker" value={load.broker?.name ?? null} />
          <Field label="Driver" value={load.assigned_driver?.full_name ?? 'Unassigned'} />
          <Field label="Truck" value={load.assigned_truck?.unit_number ?? null} />
        </dl>
      </div>

      {/* AI Analysis */}
      <AiAnalysisPanel details={load.ai_score_details} rate={load.rate} />

      {/* Driver Recommendations / Dispatch Panel */}
      {load.status === 'ACCEPTED' ? (
        <DispatchRecommendationsPanel
          load={load}
          currentUserId={currentUserId}
          onAssigned={setLoad}
        />
      ) : (
        <DriverRecommendations details={load.ai_score_details as Record<string, unknown> | null} />
      )}

      {/* Status progression (ASSIGNED → AT_PICKUP → LOADED → EN_ROUTE → DELIVERED) */}
      <StatusProgressionPanel
        load={load}
        currentUserId={currentUserId}
        onStatusChange={setLoad}
      />

      {/* Action bar (Accept / Reject — PENDING/SCORED only) */}
      <ActionBar load={load} onStatusChange={setLoad} />

      {/* Timeline / Messages tabs */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline">
              Timeline ({load.events.length})
            </TabsTrigger>
            <TabsTrigger value="messages">
              Messages ({load.messages.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <EventTimeline events={load.events} currentUserId={currentUserId} />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab messages={load.messages} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
