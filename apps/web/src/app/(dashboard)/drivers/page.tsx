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
    <div className="p-6">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
        <DriverBoardClient initialDrivers={drivers} initialTrucks={trucks} />
      </Suspense>
    </div>
  );
}
