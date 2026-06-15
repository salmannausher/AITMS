'use client';

import Link from 'next/link';
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

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-slate-100 text-slate-600',
  SCORED:    'bg-blue-50 text-blue-700 border border-blue-200',
  ACCEPTED:  'bg-primary/10 text-primary border border-primary/20',
  ASSIGNED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  AT_PICKUP: 'bg-amber-50 text-amber-700 border border-amber-200',
  LOADED:    'bg-amber-50 text-amber-700 border border-amber-200',
  EN_ROUTE:  'bg-sky-50 text-sky-700 border border-sky-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
};

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</dt>
      <dd className={`text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</dd>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-border pb-2 mb-4">
      {children}
    </p>
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

const SIDEBAR_STATUSES = new Set(['ACCEPTED', 'ASSIGNED', 'AT_PICKUP', 'LOADED', 'EN_ROUTE']);

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
    } catch { /* silently ignore */ }
  }, [initialLoad.id]);

  useLoadDetailRealtime(initialLoad.id, initialLoad.company_id, refetch);

  const pollCountRef = useRef(0);
  useEffect(() => {
    const hasRankings = !!(load.ai_score_details as Record<string, unknown> | null)?.['driver_rankings'];
    if (load.status !== 'ACCEPTED' || hasRankings) { pollCountRef.current = 0; return; }
    pollCountRef.current = 0;
    const timer = setInterval(() => {
      pollCountRef.current += 1;
      if (pollCountRef.current > 18) { clearInterval(timer); return; }
      void refetch();
    }, 5000);
    return () => clearInterval(timer);
  }, [load.status, load.ai_score_details, refetch]);

  const statusStyle = STATUS_STYLES[load.status] ?? 'bg-slate-100 text-slate-600';
  const hasSidebar = SIDEBAR_STATUSES.has(load.status);

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Page header */}
      <div className="border-b border-border bg-white px-6 py-4 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          <Link href="/dashboard" className="hover:text-primary transition-colors">Load Board</Link>
          <span>›</span>
          <span className="text-primary">{load.reference_number ?? load.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
            {load.origin_city}, {load.origin_state}
            <span className="text-muted-foreground/30 mx-3">→</span>
            {load.dest_city}, {load.dest_state}
          </h1>
          <span className={`rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}>
            {load.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 p-6 gap-5 ${hasSidebar ? 'flex items-start' : 'flex flex-col max-w-4xl'}`}>

        {/* ── Main column ── */}
        <div className={`flex flex-col gap-5 ${hasSidebar ? 'flex-1 min-w-0' : 'w-full'}`}>

          {/* Load summary */}
          <Card>
            <SectionTitle>Load Details</SectionTitle>
            <dl className="grid grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Pickup Date"    value={fmtDate(load.pickup_date)} />
              <Field label="Delivery Date"  value={fmtDate(load.delivery_date)} />
              <Field label="Load Type"      value={load.load_type} />
              <Field label="Rate"           value={fmt(load.rate)} />
              <Field label="RPM"            value={fmtRpm(load.rpm)} />
              <Field label="Miles"          value={load.estimated_miles?.toLocaleString() ?? null} />
              <Field label="Weight"         value={load.weight ? `${load.weight.toLocaleString()} lbs` : null} />
              <Field label="Commodity"      value={load.commodity} />
              <Field label="Ref #"          value={load.reference_number} mono />
              <Field label="Broker"         value={load.broker?.name ?? null} />
              <Field label="Driver"         value={load.assigned_driver?.full_name ?? 'Unassigned'} />
              <Field label="Truck"          value={load.assigned_truck?.unit_number ?? null} />
            </dl>
          </Card>

          {/* AI Analysis */}
          <AiAnalysisPanel details={load.ai_score_details} rate={load.rate} />

          {/* Action bar (PENDING / SCORED) */}
          <ActionBar load={load} onStatusChange={setLoad} />

          {/* Timeline / Messages */}
          <Card>
            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline">Timeline ({load.events.length})</TabsTrigger>
                <TabsTrigger value="messages">Messages ({load.messages.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline">
                <EventTimeline events={load.events} currentUserId={currentUserId} />
              </TabsContent>
              <TabsContent value="messages">
                <MessagesTab messages={load.messages} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* ── Right sidebar ── */}
        {hasSidebar && (
          <div className="w-80 shrink-0 flex flex-col gap-4">
            {/* Driver recommendations / dispatch panel */}
            {load.status === 'ACCEPTED' ? (
              <DispatchRecommendationsPanel
                load={load}
                currentUserId={currentUserId}
                onAssigned={setLoad}
              />
            ) : (
              <DriverRecommendations
                details={load.ai_score_details as Record<string, unknown> | null}
                loadId={load.id}
                onAssigned={setLoad}
              />
            )}

            {/* Status progression */}
            <StatusProgressionPanel
              load={load}
              currentUserId={currentUserId}
              onStatusChange={setLoad}
            />
          </div>
        )}
      </div>
    </div>
  );
}
