'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CounterOfferPanel } from './CounterOfferPanel';
import type { LoadDetail } from './types';

interface ActionBarProps {
  load: LoadDetail;
  onStatusChange: (updated: LoadDetail) => void;
}

function getCounteroffer(details: unknown): number | null {
  if (!details || typeof details !== 'object') return null;
  const d = details as Record<string, unknown>;
  return typeof d['counteroffer_rate'] === 'number' ? d['counteroffer_rate'] : null;
}

export function ActionBar({ load, onStatusChange }: ActionBarProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);

  const counterRate = getCounteroffer(load.ai_score_details);
  const showActions = load.status === 'PENDING' || load.status === 'SCORED';
  const showCounter = load.status === 'SCORED' && counterRate !== null;

  async function patchStatus(status: string, reasonText?: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${load.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reasonText }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        toast.error(err.message ?? 'Failed to update status');
        return;
      }
      const updated = await res.json() as LoadDetail;
      onStatusChange(updated);
      toast.success(`Load ${status === 'ACCEPTED' ? 'accepted' : 'rejected'}`);
      setRejecting(false);
      setReason('');
    } catch {
      toast.error('Network error — try again');
    } finally {
      setLoading(false);
    }
  }

  if (!showActions) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <button
        onClick={() => patchStatus('ACCEPTED')}
        disabled={loading}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        Accept Load
      </button>

      <Popover open={rejecting} onOpenChange={setRejecting}>
        <PopoverTrigger asChild>
          <button
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <p className="mb-2 text-sm font-medium text-gray-700">Reason for rejection?</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Optional — e.g. rate too low"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={() => patchStatus('CANCELLED', reason)}
            disabled={loading}
            className="mt-2 w-full rounded-md bg-red-600 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Confirm Rejection
          </button>
        </PopoverContent>
      </Popover>

      {showCounter && counterRate !== null && (
        <>
          <button
            onClick={() => setCounterOpen(true)}
            className="rounded-md border border-amber-400 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
          >
            Counter Offer
          </button>
          <CounterOfferPanel
            open={counterOpen}
            onOpenChange={setCounterOpen}
            suggestedRate={counterRate}
            origin={`${load.origin_city}, ${load.origin_state}`}
            dest={`${load.dest_city}, ${load.dest_state}`}
            pickupDate={load.pickup_date}
          />
        </>
      )}
    </div>
  );
}
