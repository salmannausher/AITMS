-- Add assignment tracking fields to loads
ALTER TABLE "loads" ADD COLUMN "assigned_by_user_id" TEXT;
ALTER TABLE "loads" ADD COLUMN "assigned_at" TIMESTAMPTZ;

-- Add company_id and actor_name to load_events
ALTER TABLE "load_events" ADD COLUMN "company_id" TEXT;
ALTER TABLE "load_events" ADD COLUMN "actor_name" TEXT;
