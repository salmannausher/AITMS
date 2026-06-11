import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get('status');
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/loads`);
  if (status) url.searchParams.set('status', status);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as unknown;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
