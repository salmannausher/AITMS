import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { DriverBoardClient } from './DriverBoardClient';

async function fetchWithAuth(path: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json() as Promise<unknown[]>;
}

export default async function DriversPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const [drivers, trucks] = await Promise.all([
    fetchWithAuth('/drivers', session.access_token),
    fetchWithAuth('/trucks', session.access_token),
  ]);

  return (
    <div>
      <div className="border-b border-border bg-card px-5 py-4">
        <h1 className="text-base font-semibold text-foreground">Drivers & Fleet</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage your roster and trucks</p>
      </div>
      <div className="px-5 py-5">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
          <DriverBoardClient initialDrivers={drivers} initialTrucks={trucks} />
        </Suspense>
      </div>
    </div>
  );
}
