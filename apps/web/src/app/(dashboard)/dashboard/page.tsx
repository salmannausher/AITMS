import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoadBoard } from '@/components/board/LoadBoard';
import type { Load } from '@/hooks/useLoads';

async function fetchLoads(token: string): Promise<Load[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loads?status=ACTIVE`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json() as Promise<Load[]>;
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const initialLoads = session ? await fetchLoads(session.access_token) : [];

  return (
    <Suspense>
      <LoadBoard
        initialLoads={initialLoads}
        companyId={user.company_id}
      />
    </Suspense>
  );
}
