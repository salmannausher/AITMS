-- ============================================================
-- Supabase Row-Level Security Policies
-- Apply manually in Supabase SQL Editor before production launch.
-- These policies enforce tenant isolation at the database layer
-- as a defence-in-depth measure alongside application-level guards.
-- ============================================================

-- Enable RLS on all business tables
ALTER TABLE loads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_events ENABLE ROW LEVEL SECURITY;

-- loads
CREATE POLICY "tenant_isolation" ON loads
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id');

-- drivers
CREATE POLICY "tenant_isolation" ON drivers
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id');

-- trucks
CREATE POLICY "tenant_isolation" ON trucks
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id');

-- messages
CREATE POLICY "tenant_isolation" ON messages
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id');

-- ai_tasks
CREATE POLICY "tenant_isolation" ON ai_tasks
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id');

-- brokers
CREATE POLICY "tenant_isolation" ON brokers
  FOR ALL USING (company_id = auth.jwt() ->> 'company_id');

-- load_events — no company_id column; restrict via load ownership
CREATE POLICY "tenant_isolation" ON load_events
  FOR ALL USING (
    load_id IN (
      SELECT id FROM loads WHERE company_id = auth.jwt() ->> 'company_id'
    )
  );

-- NOTE: companies and users tables are NOT covered here.
-- companies: each row IS the tenant — access controlled by service key only.
-- users: the Supabase Auth service key is used for user management; add a
--        separate policy if direct user table queries are exposed.
