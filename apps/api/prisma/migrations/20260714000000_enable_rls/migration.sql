-- Enable Row-Level Security on every table in the public schema.
--
-- The NestJS API connects via Prisma as the Supabase `postgres` role, which has
-- BYPASSRLS, so all server-side access is unaffected. Enabling RLS with no policy
-- is deny-by-default: it blocks the `anon` / `authenticated` roles that reach the
-- database through the public Data API (PostgREST + Realtime) using the browser
-- anon key. This closes the `rls_disabled_in_public` hole where anyone with the
-- project URL + public anon key could read/write every table directly.
--
-- The browser only needs direct read access to one table: `loads`, which the
-- dispatch board and load-detail page subscribe to via Supabase Realtime
-- (postgres_changes). That requires an explicit SELECT policy scoped to the
-- authenticated user's company; all other tables stay deny-all.

ALTER TABLE public.companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trucks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache        ENABLE ROW LEVEL SECURITY;

-- Realtime on the load board: authenticated users may read rows for their own
-- company only. company_id is read from the JWT's app_metadata claim, which is
-- server-controlled (set via auth.admin.updateUserById in CompaniesService) and
-- NOT user-editable — unlike user_metadata, which must never be trusted for authz.
DROP POLICY IF EXISTS "authenticated can read own company loads" ON public.loads;
CREATE POLICY "authenticated can read own company loads"
  ON public.loads
  FOR SELECT
  TO authenticated
  USING (
    company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')
  );
