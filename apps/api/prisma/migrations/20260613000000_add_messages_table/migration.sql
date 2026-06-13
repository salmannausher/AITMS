-- Migration: restructure messages table
-- Drops legacy columns (from_contact, to_contact, media_urls, ai_parsed),
-- converts status from MessageStatus enum to TEXT,
-- adds driver_id FK, wa_id, from_number, to_number.

-- 1. Drop legacy columns
ALTER TABLE messages DROP COLUMN IF EXISTS from_contact;
ALTER TABLE messages DROP COLUMN IF EXISTS to_contact;
ALTER TABLE messages DROP COLUMN IF EXISTS media_urls;
ALTER TABLE messages DROP COLUMN IF EXISTS ai_parsed;

-- 2. Convert status from MessageStatus enum to nullable TEXT
ALTER TABLE messages ALTER COLUMN status DROP DEFAULT;
ALTER TABLE messages ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- 3. Add new columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS wa_id     TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS from_number TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS to_number   TEXT;

-- 4. Drop MessageStatus enum (no longer used)
DROP TYPE IF EXISTS "MessageStatus";

-- 5. Rebuild indexes
DROP INDEX IF EXISTS "messages_company_id_idx";
DROP INDEX IF EXISTS "messages_load_id_idx";
CREATE INDEX IF NOT EXISTS "messages_company_id_driver_id_idx" ON messages(company_id, driver_id);
CREATE INDEX IF NOT EXISTS "messages_company_id_load_id_idx"   ON messages(company_id, load_id);
-- external_id index was already named messages_external_id_idx — leave it
