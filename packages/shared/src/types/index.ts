// ============================================================
// Shared TypeScript types — imported by both apps/web and apps/api
// ============================================================

export type { NotificationType, AppNotification } from './notifications';

export type UserRole = 'OWNER' | 'DISPATCHER' | 'VIEWER';

/** Shape stored in Supabase JWT custom claims (app_metadata) */
export type JwtCustomClaims = {
  company_id: string;
  role: UserRole;
};

/** Authenticated session user — returned from server-side session reads */
export type SessionUser = {
  id: string;         // Supabase auth user UUID
  email: string;
  full_name: string;
  company_id: string;
  role: UserRole;
};
