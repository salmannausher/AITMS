import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type CarrierCostSettings } from '@aitms/shared';
import { CostSettingsForm } from './CostSettingsForm';

async function fetchCostSettings(token: string): Promise<CarrierCostSettings | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json() as { costs: CarrierCostSettings | null };
    return body.costs;
  } catch {
    return null;
  }
}

export default async function CostSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const initialValues = session
    ? await fetchCostSettings(session.access_token)
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Carrier Cost Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set your operating costs so the AI can accurately score loads.
        </p>
      </div>

      <CostSettingsForm
        initialValues={initialValues}
        isOwner={user.role === 'OWNER'}
      />
    </div>
  );
}
