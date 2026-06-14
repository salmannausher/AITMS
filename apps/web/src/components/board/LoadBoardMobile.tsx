'use client';

import { useState } from 'react';
import { useLoads, type Load, type LoadStatusValue } from '@/hooks/useLoads';
import { LoadCard } from './LoadCard';

type TabValue = 'ALL' | 'PENDING' | 'SCORED' | 'ACCEPTED' | 'ASSIGNED' | 'EN_ROUTE';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SCORED', label: 'Scored' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'EN_ROUTE', label: 'En Route' },
];

const STAT_CHIPS = [
  {
    key: 'total_active' as const,
    label: 'Active Loads',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003d9b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
    format: (v: number | null) => v?.toString() ?? '—',
  },
  {
    key: 'needs_assignment' as const,
    label: 'Need Assignment',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>
      </svg>
    ),
    format: (v: number | null) => v?.toString() ?? '—',
  },
  {
    key: 'drivers_available' as const,
    label: 'Drivers Ready',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect width="13" height="8" x="8" y="13" rx="1"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/>
      </svg>
    ),
    format: (v: number | null) => v?.toString() ?? '—',
  },
  {
    key: 'todays_avg_rpm' as const,
    label: 'Avg RPM',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5e4db9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    format: (v: number | null) => v != null ? `$${v.toFixed(2)}` : '—',
  },
];

interface LoadBoardMobileProps {
  initialLoads: Load[];
  companyId: string;
}

export function LoadBoardMobile({ initialLoads, companyId: _companyId }: LoadBoardMobileProps) {
  const { loads, stats, isStatsLoading } = useLoads(initialLoads);
  const [activeTab, setActiveTab] = useState<TabValue>('ALL');

  const filtered: Load[] = activeTab === 'ALL'
    ? loads.filter((l) =>
        (['PENDING', 'SCORED', 'ACCEPTED', 'ASSIGNED', 'EN_ROUTE'] as LoadStatusValue[]).includes(l.status)
      )
    : loads.filter((l) => l.status === activeTab);

  return (
    <div className="flex flex-col" style={{ height: '100dvh', backgroundColor: '#faf9ff' }}>
      {/* Fixed top header */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b"
        style={{ borderColor: '#e8eaf0' }}
      >
        <span className="font-display text-lg font-bold" style={{ color: '#051a3e' }}>
          Logistics OS
        </span>
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            className="flex items-center justify-center w-9 h-9 rounded-xl border"
            style={{ borderColor: '#c3c6d6', backgroundColor: '#f8fafc' }}
            aria-label="Search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          {/* Filter */}
          <button
            className="flex items-center justify-center w-9 h-9 rounded-xl border"
            style={{ borderColor: '#c3c6d6', backgroundColor: '#f8fafc' }}
            aria-label="Filter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="6" y2="6"/><line x1="8" x2="16" y1="12" y2="12"/><line x1="11" x2="13" y1="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stats chips row */}
      <div
        className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {STAT_CHIPS.map(({ key, label, icon, format }) => {
          const value = stats ? stats[key] : null;
          return (
            <div
              key={key}
              className="shrink-0 flex items-center gap-2 rounded-xl border bg-white px-3 py-2"
              style={{ borderColor: '#c3c6d6' }}
            >
              {icon}
              <div>
                <div className="text-[11px] font-medium whitespace-nowrap" style={{ color: '#64748b' }}>{label}</div>
                <div className="font-display text-[14px] font-bold leading-tight" style={{ color: '#051a3e' }}>
                  {isStatsLoading ? '…' : format(value as number | null)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status filter tabs */}
      <div
        className="shrink-0 flex gap-1.5 px-4 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {TABS.map(({ value, label }) => {
          const active = activeTab === value;
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: '#003d9b', color: '#ffffff', fontWeight: 700 }
                  : { backgroundColor: '#ffffff', color: '#64748b', border: '1px solid #c3c6d6' }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c3c6d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>No loads in this category</p>
          </div>
        ) : (
          filtered.map((load) => <LoadCard key={load.id} load={load} />)
        )}
      </div>
    </div>
  );
}
