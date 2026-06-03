import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { SessionUser, JwtCustomClaims } from '@aitms/shared';

/**
 * Reads the current session from cookies and returns a typed SessionUser.
 * Returns null if no session exists.
 * Use in Server Components and Route Handlers only.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const claims = user.app_metadata as Partial<JwtCustomClaims>;

  if (!claims.company_id || !claims.role) return null;

  return {
    id: user.id,
    email: user.email,
    full_name: (user.user_metadata['full_name'] as string | undefined) ?? '',
    company_id: claims.company_id,
    role: claims.role,
  };
}
