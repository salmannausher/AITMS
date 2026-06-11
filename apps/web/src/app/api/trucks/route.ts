import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const available = req.nextUrl.searchParams.get('available');
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/trucks`);
  if (available) url.searchParams.set('available', available);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });
  return NextResponse.json(await res.json() as unknown, { status: res.status });
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as unknown;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trucks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json() as unknown, { status: res.status });
}
