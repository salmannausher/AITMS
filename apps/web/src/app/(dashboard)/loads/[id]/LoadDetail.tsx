'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AiAnalysisPanel } from '@/components/loads/AiAnalysisPanel';
import { ActionBar } from '@/components/loads/ActionBar';
import { EventTimeline } from '@/components/loads/EventTimeline';
import { MessagesTab } from '@/components/loads/MessagesTab';
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

export function LoadDetail({ load: initialLoad }: { load: LoadDetailType }) {
  const [load, setLoad] = useState(initialLoad);

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
          <Field label="Truck" value={load.assigned_truck?.truck_number ?? null} />
        </dl>
      </div>

      {/* AI Analysis */}
      <AiAnalysisPanel details={load.ai_score_details} rate={load.rate} />

      {/* Action bar */}
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
            <EventTimeline events={load.events} />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesTab messages={load.messages} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
