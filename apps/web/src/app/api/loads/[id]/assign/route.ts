import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as unknown;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loads/${params.id}/assign`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as unknown;
  return NextResponse.json(data, { status: res.status });
}
