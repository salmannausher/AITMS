import { notFound } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoadDetail } from './LoadDetail';
import type { LoadDetail as LoadDetailType } from '@/components/loads/types';

type Params = { params: { id: string } };

async function fetchLoad(id: string, token: string): Promise<LoadDetailType | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<LoadDetailType>;
  } catch {
    return null;
  }
}

export default async function LoadDetailPage({ params }: Params) {
  const user = await getSessionUser();

  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !user) notFound();

  const load = await fetchLoad(params.id, session.access_token);
  if (!load) notFound();

  return <LoadDetail load={load} currentUserId={user.id} />;
}
