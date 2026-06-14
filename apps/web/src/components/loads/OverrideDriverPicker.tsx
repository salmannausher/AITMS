'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { LoadDetail } from './types';

interface Driver {
  id: string;
  full_name: string;
  status: string;
  hos_remaining_hours: number | null;
  truck?: { unit_number: string; truck_type: string } | null;
}

interface Props {
  loadId: string;
  onAssigned: (updated: LoadDetail) => void;
  onClose: () => void;
}

export function OverrideDriverPicker({ loadId, onAssigned, onClose }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/drivers')
      .then((r) => r.json())
      .then((data) => setDrivers(data as Driver[]))
      .catch(() => toast.error('Failed to load drivers'))
      .finally(() => setLoading(false));
  }, []);

  async function assign(driverId: string) {
    setAssigning(driverId);
    try {
      const res = await fetch(`/api/loads/${loadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        toast.error(err.message ?? 'Failed to assign driver');
        return;
      }
      const updated = await res.json() as LoadDetail;
      toast.success('Driver assigned');
      onAssigned(updated);
      onClose();
    } catch {
      toast.error('Network error — try again');
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Pick a Driver</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">Loading drivers…</div>
          )}
          {!loading && drivers.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">No drivers found.</div>
          )}
          {drivers.map((d) => (
            <button
              key={d.id}
              disabled={assigning !== null}
              onClick={() => assign(d.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted transition-colors disabled:opacity-60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                {d.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{d.full_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {d.truck?.truck_type ?? 'No truck'} · {d.hos_remaining_hours != null ? `${d.hos_remaining_hours}h HOS` : 'HOS unknown'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                d.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
              }`}>
                {d.status}
              </span>
              {assigning === d.id && (
                <span className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
