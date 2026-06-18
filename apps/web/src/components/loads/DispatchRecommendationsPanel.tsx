'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LoadDetail } from './types';

// ── Types ────────────────────────────────────────────────────────────────────

interface RankedDriver {
  driver_id: string;
  driver_name?: string;
  truck_unit_number?: string;
  truck_type?: string;
  rank: number;
  score: number;
  reason: string;
  deadhead_miles: number | null;
  eta_hours: number | null;
  truck_id?: string;
}

interface DriverRankings {
  ranked_drivers: RankedDriver[];
  recommendation_summary?: string;
}

interface AvailableDriver {
  id: string;
  full_name: string;
  cdl_class: string;
  hos_remaining_hours: number;
  status: string;
  truck?: { id: string; unit_number: string; type: string } | null;
  assigned_truck_id?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

function rankBadgeStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { backgroundColor: '#2563eb', color: '#fff' };
  return { backgroundColor: '#e5e7eb', color: '#6b7280' };
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ── Override picker ───────────────────────────────────────────────────────────

type SortKey = 'hos' | 'name';

function OverridePicker({
  open,
  onClose,
  onSelect,
  assigningDriverId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (driver: AvailableDriver) => void;
  assigningDriverId: string | null;
}) {
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [sort, setSort] = useState<SortKey>('hos');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/drivers?status=AVAILABLE')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDrivers(data as AvailableDriver[]))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, [open]);

  const sorted = [...drivers].sort((a, b) => {
    if (sort === 'hos') return b.hos_remaining_hours - a.hos_remaining_hours;
    return a.full_name.localeCompare(b.full_name);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Override — Pick a Driver</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 px-6 pt-3">
          <button
            className={`text-xs px-3 py-1 rounded-full border ${sort === 'hos' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'}`}
            onClick={() => setSort('hos')}
          >
            By HOS
          </button>
          <button
            className={`text-xs px-3 py-1 rounded-full border ${sort === 'name' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'}`}
            onClick={() => setSort('name')}
          >
            By Name
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 pb-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Loading drivers…</p>
          ) : sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No available drivers.</p>
          ) : (
            <table className="w-full mt-3 text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-400 text-left">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">CDL</th>
                  <th className="pb-2 font-medium">Truck</th>
                  <th className="pb-2 font-medium">HOS</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-900">{d.full_name}</td>
                    <td className="py-2 text-gray-500">Class {d.cdl_class}</td>
                    <td className="py-2 text-gray-500">
                      {d.truck ? `${d.truck.unit_number} · ${d.truck.type.replace('_', ' ')}` : '—'}
                    </td>
                    <td className="py-2 text-gray-500">{d.hos_remaining_hours}h</td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={assigningDriverId === d.id}
                        onClick={() => onSelect(d)}
                      >
                        {assigningDriverId === d.id ? 'Assigning…' : 'Select'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Recommendation card ────────────────────────────────────────────────────────

function RecommendationCard({
  rec,
  isAssigning,
  assigningDriverId,
  onAssign,
  onOverride,
}: {
  rec: RankedDriver;
  isAssigning: boolean;
  assigningDriverId: string | null;
  onAssign: (driverId: string, truckId: string) => void;
  onOverride: (driverId: string) => void;
}) {
  const truckId = rec.truck_id ?? '';
  const busy = assigningDriverId === rec.driver_id;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-3">
      {/* Header: rank + name + avatar */}
      <div className="flex items-center gap-3">
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={rankBadgeStyle(rec.rank)}
        >
          #{rec.rank}
        </span>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
          {initials(rec.driver_name ?? '??')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {rec.driver_name ?? rec.driver_id}
          </p>
          {(rec.truck_unit_number || rec.truck_type) && (
            <p className="text-xs text-gray-500">
              {[rec.truck_unit_number, rec.truck_type?.replace('_', ' ')]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-xs text-gray-500">
        {rec.deadhead_miles != null && <span>{rec.deadhead_miles} mi deadhead</span>}
        {rec.eta_hours != null && <span>~{rec.eta_hours}h ETA</span>}
      </div>

      {/* Fit score bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Fit score</span>
          <span className="font-medium" style={{ color: scoreColor(rec.score) }}>
            {rec.score}/100
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${rec.score}%`, backgroundColor: scoreColor(rec.score) }}
          />
        </div>
      </div>

      {/* AI reason */}
      <p className="text-xs italic text-gray-400 leading-snug">{rec.reason}</p>

      {/* CTA */}
      {truckId ? (
        <Button
          variant={rec.rank === 1 ? 'default' : 'outline'}
          size="sm"
          disabled={isAssigning}
          onClick={() => onAssign(rec.driver_id, truckId)}
        >
          {busy ? 'Assigning…' : 'Assign This Driver'}
        </Button>
      ) : (
        <p className="text-xs text-amber-600">No truck assigned — use override to select</p>
      )}
      <button
        className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 text-left"
        onClick={() => onOverride(rec.driver_id)}
      >
        Override — pick a different driver
      </button>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  load: LoadDetail;
  currentUserId: string;
  onAssigned: (updatedLoad: LoadDetail) => void;
}

export function DispatchRecommendationsPanel({ load, onAssigned }: Props) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const pollRef = useRef(0);

  const rankings = (load.ai_score_details as Record<string, unknown> | null)?.[
    'driver_rankings'
  ] as DriverRankings | undefined;
  const recs = load.status === 'ACCEPTED' ? (rankings?.ranked_drivers?.slice(0, 3) ?? []) : [];

  // Poll for recommendations if empty (max 12 attempts / 1 min)
  useEffect(() => {
    if (load.status !== 'ACCEPTED') return;
    if (recs.length > 0) {
      pollRef.current = 0;
      return;
    }
    const timer = setInterval(() => {
      pollRef.current += 1;
      if (pollRef.current > 12) {
        clearInterval(timer);
        return;
      }
      fetch(`/api/loads/${load.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) onAssigned(data as LoadDetail);
        })
        .catch(() => {
          /* ignore */
        });
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load.id, recs.length]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  const handleAssign = useCallback(
    async (driverId: string, truckId: string) => {
      if (isAssigning) return;
      setIsAssigning(true);
      setAssigningDriverId(driverId);
      const snapshot = load;

      // Optimistic update
      onAssigned({ ...load, status: 'ASSIGNED', assigned_driver_id: driverId } as LoadDetail);

      try {
        const res = await fetch(`/api/loads/${load.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driver_id: driverId, truck_id: truckId }),
        });
        const data = (await res.json()) as LoadDetail & { message?: string };
        if (!res.ok) {
          onAssigned(snapshot);
          showToast(`Assignment failed: ${data.message ?? res.statusText}`);
        } else {
          onAssigned(data);
          setOverrideOpen(false);
        }
      } catch (err) {
        onAssigned(snapshot);
        showToast(`Assignment failed: ${err instanceof Error ? err.message : 'Network error'}`);
      } finally {
        setIsAssigning(false);
        setAssigningDriverId(null);
      }
    },
    [isAssigning, load, onAssigned, showToast],
  );

  // Only shown for ACCEPTED loads — placed after hooks to satisfy rules-of-hooks
  if (load.status !== 'ACCEPTED') return null;

  const handleOverrideSelect = (driver: AvailableDriver) => {
    const truckId = driver.truck?.id ?? driver.assigned_truck_id ?? '';
    if (!truckId) {
      showToast('This driver has no assigned truck. Assign a truck first.');
      return;
    }
    void handleAssign(driver.id, truckId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Dispatch Recommendations</h3>
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() => setOverrideOpen(true)}
        >
          Override — pick a different driver
        </button>
      </div>

      {recs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 flex items-center gap-3">
          {/* Simple CSS spinner */}
          <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-400">Driver recommendations are being generated…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recs.map((rec) => (
            <RecommendationCard
              key={rec.driver_id}
              rec={rec}
              isAssigning={isAssigning}
              assigningDriverId={assigningDriverId}
              onAssign={handleAssign}
              onOverride={() => setOverrideOpen(true)}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      <OverridePicker
        open={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        onSelect={handleOverrideSelect}
        assigningDriverId={assigningDriverId}
      />
    </div>
  );
}
