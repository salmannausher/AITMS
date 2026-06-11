-- Migration: add_drivers_trucks
-- Rebuilds drivers and trucks tables with updated schema.
-- Tables are empty in production (no driver/truck data yet).

-- 1. Add CdlClass enum
CREATE TYPE "CdlClass" AS ENUM ('A', 'B', 'C');

-- 2. Replace DriverStatus enum (remove SLEEPER_BERTH, INACTIVE)
ALTER TABLE "drivers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "DriverStatus" RENAME TO "DriverStatus_old";
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ON_LOAD', 'OFF_DUTY');
ALTER TABLE "drivers" ALTER COLUMN "status" TYPE "DriverStatus" USING "status"::text::"DriverStatus";
ALTER TABLE "drivers" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE'::"DriverStatus";
DROP TYPE "DriverStatus_old";

-- 3. Add new TruckType values
ALTER TYPE "TruckType" ADD VALUE IF NOT EXISTS 'LOWBOY';
ALTER TYPE "TruckType" ADD VALUE IF NOT EXISTS 'TANKER';
ALTER TYPE "TruckType" ADD VALUE IF NOT EXISTS 'OTHER';

-- 4. Replace TruckStatus enum (remove IN_MAINTENANCE)
ALTER TABLE "trucks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "TruckStatus" RENAME TO "TruckStatus_old";
CREATE TYPE "TruckStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'OUT_OF_SERVICE');
ALTER TABLE "trucks" ALTER COLUMN "status" TYPE "TruckStatus" USING "status"::text::"TruckStatus";
ALTER TABLE "trucks" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE'::"TruckStatus";
DROP TYPE "TruckStatus_old";

-- 5. Update drivers table
ALTER TABLE "drivers"
  DROP COLUMN IF EXISTS "current_location",
  DROP COLUMN IF EXISTS "assigned_truck",
  ALTER COLUMN "cdl_class" TYPE "CdlClass" USING "cdl_class"::"CdlClass",
  ALTER COLUMN "home_city" SET NOT NULL,
  ALTER COLUMN "home_state" SET NOT NULL,
  ALTER COLUMN "hos_remaining_hours" TYPE float8 USING "hos_remaining_hours"::float8,
  ALTER COLUMN "hos_remaining_hours" SET DEFAULT 70,
  ADD COLUMN IF NOT EXISTS "assigned_truck_id" TEXT;

ALTER TABLE "drivers" ADD CONSTRAINT "drivers_assigned_truck_id_key" UNIQUE ("assigned_truck_id");

-- 6. Update trucks table
ALTER TABLE "trucks"
  DROP COLUMN IF EXISTS "assigned_driver_id",
  ALTER COLUMN "year" DROP NOT NULL,
  ALTER COLUMN "make" DROP NOT NULL,
  ALTER COLUMN "model" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- 7. Add unique constraint on trucks(company_id, unit_number)
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_company_id_unit_number_key" UNIQUE ("company_id", "unit_number");

-- 8. Add FK from drivers.assigned_truck_id -> trucks.id
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_assigned_truck_id_fkey"
  FOREIGN KEY ("assigned_truck_id") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
