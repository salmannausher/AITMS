import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: { id: string } };

async function getSession() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loads/${params.id}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
