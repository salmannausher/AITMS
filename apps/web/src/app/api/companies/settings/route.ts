import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function getToken(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as unknown;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
