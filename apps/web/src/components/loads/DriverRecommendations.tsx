'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { OverrideDriverPicker } from './OverrideDriverPicker';
import type { LoadDetail } from './types';

interface RankedDriver {
  driver_id: string;
  driver_name?: string;
  rank: number;
  score: number;
  reason: string;
  deadhead_miles: number | null;
  eta_hours: number | null;
}

interface DriverRankings {
  ranked_drivers: RankedDriver[];
  recommendation_summary: string;
}

interface Props {
  details: Record<string, unknown> | null | undefined;
  loadId: string;
  onAssigned: (updated: LoadDetail) => void;
}

type ScoreColors = { bar: string; badgeBg: string; badgeText: string; border: string; bg: string; text: string; btnBg: string; btnText: string };

function scoreColor(score: number): ScoreColors {
  if (score >= 75) return {
    bar: '#10b981',
    badgeBg: '#003d9b', badgeText: '#fff',
    border: '#003d9b',
    bg: '#f0fdf4', text: '#15803d',
    btnBg: '#003d9b', btnText: '#fff',
  };
  if (score >= 45) return {
    bar: '#f59e0b',
    badgeBg: '#f59e0b', badgeText: '#fff',
    border: '#fbbf24',
    bg: '#fffbeb', text: '#b45309',
    btnBg: '#d97706', btnText: '#fff',
  };
  return {
    bar: '#ef4444',
    badgeBg: '#ef4444', badgeText: '#fff',
    border: '#fca5a5',
    bg: '#fef2f2', text: '#b91c1c',
    btnBg: '#64748b', btnText: '#fff',
  };
}

function initials(name: string | undefined, id: string): string {
  if (!name) return id.slice(0, 2).toUpperCase();
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function firstName(name: string | undefined): string {
  if (!name) return 'Driver';
  return name.trim().split(' ')[0] ?? name;
}

function DriverCard({
  driver,
  isTop,
  loadId,
  onAssigned,
  onOverride,
}: {
  driver: RankedDriver;
  isTop: boolean;
  loadId: string;
  onAssigned: (updated: LoadDetail) => void;
  onOverride: () => void;
}) {
  const [assigning, setAssigning] = useState(false);
  const colors = scoreColor(driver.score);

  async function handleAssign() {
    setAssigning(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driver.driver_id }),
      });
      if (!res.ok) {
        const err = await res.json() as { message?: string };
        toast.error(err.message ?? 'Failed to assign driver');
        return;
      }
      const updated = await res.json() as LoadDetail;
      toast.success(`${driver.driver_name ?? 'Driver'} assigned`);
      onAssigned(updated);
    } catch {
      toast.error('Network error — try again');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div
      className={`rounded-xl bg-card p-4 ${isTop ? 'shadow-md' : 'opacity-80 hover:opacity-100 transition-opacity'}`}
      style={{ border: `2px solid ${isTop ? colors.border : '#e2e8f0'}` }}
    >
      {/* Driver header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
            {initials(driver.driver_name, driver.driver_id)}
          </div>
          <span
            className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
          >
            #{driver.rank}
          </span>
        </div>
        <div className="min-w-0">
          <h4 className="font-display text-sm font-semibold text-foreground truncate">
            {driver.driver_name ?? driver.driver_id}
          </h4>
          <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
            {driver.deadhead_miles != null && <span>{driver.deadhead_miles} mi deadhead</span>}
            {driver.eta_hours != null && <span>~{driver.eta_hours}h ETA</span>}
          </div>
        </div>
      </div>

      {/* Fit score bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] font-semibold mb-1.5">
          <span className="uppercase tracking-wider text-muted-foreground">Fit Score</span>
          <span style={{ color: colors.text }}>{driver.score}/100</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${driver.score}%`, backgroundColor: colors.bar }} />
        </div>
      </div>

      {/* AI reasoning */}
      <div className="rounded-lg px-3 py-2 text-xs italic leading-relaxed mb-3"
        style={{ backgroundColor: colors.bg, color: colors.text }}>
        &ldquo;{driver.reason}&rdquo;
      </div>

      {/* PRIMARY: Assign button */}
      <button
        onClick={handleAssign}
        disabled={assigning}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{ backgroundColor: colors.btnBg, color: colors.btnText }}
      >
        {assigning ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Assigning…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>
            </svg>
            Assign {firstName(driver.driver_name)}
          </>
        )}
      </button>

      {/* SECONDARY: Override link */}
      <button
        onClick={onOverride}
        className="mt-2 w-full text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2 text-center transition-colors"
      >
        Pick a different driver
      </button>
    </div>
  );
}

export function DriverRecommendations({ details, loadId, onAssigned }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!details) return null;
  const rankings = details['driver_rankings'] as DriverRankings | undefined;
  if (!rankings?.ranked_drivers?.length) return null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-sm font-semibold text-foreground">Driver Recommendations</h2>
        {rankings.recommendation_summary && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rankings.recommendation_summary}</p>
        )}
      </div>

      <div className="space-y-3">
        {rankings.ranked_drivers.map((d, i) => (
          <DriverCard
            key={d.driver_id}
            driver={d}
            isTop={i === 0}
            loadId={loadId}
            onAssigned={onAssigned}
            onOverride={() => setPickerOpen(true)}
          />
        ))}
      </div>

      {pickerOpen && (
        <OverrideDriverPicker
          loadId={loadId}
          onAssigned={onAssigned}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
