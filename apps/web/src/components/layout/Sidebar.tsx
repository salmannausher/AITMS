'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const NAV_TOP = [
  {
    href: '/dashboard',
    label: 'Load Board',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/drivers',
    label: 'Fleet',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect width="13" height="8" x="8" y="13" rx="1"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/>
      </svg>
    ),
  },
  {
    href: '/settings/costs',
    label: 'AI Insights',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M22 2 12 12"/><circle cx="19" cy="5" r="3"/>
      </svg>
    ),
  },
];


function getInitials(name: string, email: string): string {
  if (name.trim()) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
      : (parts[0] ?? '').slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name: (data.user.user_metadata['full_name'] as string | undefined) ?? '',
          email: data.user.email ?? '',
        });
      }
    });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '#') return false;
    return pathname.startsWith(href);
  }

  const displayName = user?.name || user?.email || '';
  const initials = user ? getInitials(user.name, user.email) : '..';

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col bg-white border-r" style={{ borderColor: '#e8eaf0' }}>
      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{ borderColor: '#e8eaf0' }}>
        <div className="font-display text-base font-bold" style={{ color: '#003d9b' }}>Dispatcher Hub</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: '#8b93a7' }}>Operational Center</div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {NAV_TOP.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: active ? '#eff3fb' : 'transparent',
                color: active ? '#003d9b' : '#64748b',
                borderLeft: active ? '3px solid #003d9b' : '3px solid transparent',
              }}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* + New Load CTA */}
      <div className="px-4 pb-4">
        <Link
          href="/loads/new"
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#003d9b' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          New Load
        </Link>
      </div>

      {/* User tile */}
      <div className="border-t px-3 py-3 relative" style={{ borderColor: '#e8eaf0' }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#003d9b' }}>
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#1e2a3b' }}>
              {displayName || <span className="text-slate-300">Loading…</span>}
            </p>
            <p className="text-[10px] truncate" style={{ color: '#94a3b8' }}>Dispatcher</p>
          </div>
          {/* Chevron */}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border bg-white shadow-lg overflow-hidden"
            style={{ borderColor: '#e8eaf0' }}
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b" style={{ borderColor: '#f1f3f9' }}>
              <p className="text-xs font-semibold truncate" style={{ color: '#1e2a3b' }}>{user?.name || '—'}</p>
              <p className="text-[11px] truncate" style={{ color: '#94a3b8' }}>{user?.email}</p>
            </div>

            {/* Menu items */}
            <Link
              href="/settings/costs"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
              style={{ color: '#475569' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Settings
            </Link>

            <div className="border-t mx-3" style={{ borderColor: '#f1f3f9' }} />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 hover:text-red-600"
              style={{ color: '#475569' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
