'use client';

import { useRouter } from 'next/navigation';
import type { Load } from '@/hooks/useLoads';

// ── helpers ────────────────────────────────────────────────────────────────

function loadId(load: Load): string {
  if (load.reference_number) return `#${load.reference_number}`;
  return `#L-${load.id.slice(-4).toUpperCase()}`;
}

function fmtRate(rate: string | null): string {
  if (!rate) return '—';
  return `$${Number(rate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtRpm(rpm: string | null): string | null {
  if (!rpm) return null;
  return `$${Number(rpm).toFixed(2)}/mi`;
}

function fmtWeight(w: number | null): string | null {
  if (!w) return null;
  return w >= 1000 ? `${(w / 1000).toFixed(1)}k lbs` : `${w} lbs`;
}

function equipLabel(type: string | null): string {
  if (!type) return 'DRY VAN';
  return type.replace(/_/g, ' ');
}

function driverInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// AI score → badge config
const SCORE_BADGE = {
  GOOD:     { bg: '#ede9ff', color: '#5e4db9', label: 'GOOD' },
  MARGINAL: { bg: '#fef3c7', color: '#b45309', label: 'FAIR' },
  AVOID:    { bg: '#fee2e2', color: '#b91c1c', label: 'AVOID' },
} as const;

// ── Column-specific overlays ────────────────────────────────────────────────

function AssignDriverBadge() {
  return (
    <div className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2"
      style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#003d9b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>
      </svg>
      <span className="text-[11px] font-semibold" style={{ color: '#003d9b' }}>Assign Driver</span>
    </div>
  );
}

function DriverChip({ driver }: { driver: Load['assigned_driver'] }) {
  if (!driver) return null;
  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2"
      style={{ backgroundColor: '#f0f4ff', border: '1px solid #c7d7ff' }}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: '#003d9b' }}>
        {driverInitials(driver.full_name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold truncate" style={{ color: '#051a3e' }}>{driver.full_name}</p>
        <p className="text-[10px]" style={{ color: '#64748b' }}>Driver Assigned</p>
      </div>
      <span className="text-[10px] font-mono-data shrink-0" style={{ color: '#003d9b' }}>
        ETA: On Route
      </span>
    </div>
  );
}

function TransitProgress() {
  const pct = 65;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold" style={{ color: '#004b59' }}>Transit Progress</span>
        <span className="text-[10px] font-mono-data" style={{ color: '#004b59' }}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: '#d1fae5' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#004b59' }} />
      </div>
    </div>
  );
}

// ── Main card ───────────────────────────────────────────────────────────────

export function LoadCard({ load }: { load: Load }) {
  const router = useRouter();
  const scoreCfg = load.ai_score ? SCORE_BADGE[load.ai_score] : null;

  return (
    <div
      onClick={() => router.push(`/loads/${load.id}`)}
      className="cursor-pointer rounded-xl bg-white transition-all hover:shadow-lg group"
      style={{ border: '1px solid #c3c6d6' }}
    >
      <div className="p-3 space-y-2">
        {/* Row 1: Load ID + AI score badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono-data text-[12px] font-bold" style={{ color: '#051a3e' }}>
            {loadId(load)}
          </span>
          <div className="flex items-center gap-1.5">
            {load.needs_review && (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                Review
              </span>
            )}
            {scoreCfg && (
              <span className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: scoreCfg.bg, color: scoreCfg.color }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                {scoreCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Route */}
        <p className="font-display text-[13px] font-semibold leading-tight" style={{ color: '#051a3e' }}>
          {load.origin_city}, {load.origin_state}
          <span className="mx-1.5 font-normal" style={{ color: '#94a3b8' }}>→</span>
          {load.dest_city}, {load.dest_state}
        </p>

        {/* Row 3: Equipment pills + weight */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: '#e8edf8', color: '#003d9b' }}>
            {equipLabel(load.load_type)}
          </span>
          {load.weight && (
            <span className="text-[10px]" style={{ color: '#64748b' }}>{fmtWeight(load.weight)}</span>
          )}
          {load.estimated_miles && (
            <span className="text-[10px]" style={{ color: '#94a3b8' }}>{load.estimated_miles.toLocaleString()} mi</span>
          )}
        </div>

        {/* Row 4: Rate + RPM */}
        <div className="flex items-end justify-between pt-1 border-t" style={{ borderColor: '#eef0f6' }}>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>RATE</div>
            <div className="font-display text-[15px] font-bold" style={{ color: '#003d9b' }}>{fmtRate(load.rate)}</div>
          </div>
          {fmtRpm(load.rpm) && (
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>RPM</div>
              <div className="font-mono-data text-[13px] font-semibold" style={{ color: '#051a3e' }}>{fmtRpm(load.rpm)}</div>
            </div>
          )}
        </div>

        {/* Status-specific overlays */}
        {load.status === 'ACCEPTED' && !load.assigned_driver && (
          <AssignDriverBadge />
        )}
        {(load.status === 'ASSIGNED' || load.status === 'AT_PICKUP' || load.status === 'LOADED') && (
          <DriverChip driver={load.assigned_driver} />
        )}
        {load.status === 'EN_ROUTE' && <TransitProgress />}
      </div>
    </div>
  );
}
