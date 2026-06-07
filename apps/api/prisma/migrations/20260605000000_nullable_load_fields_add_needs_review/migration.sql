-- AlterTable: make delivery_date, load_type, rate nullable on loads
-- and add needs_review boolean field

ALTER TABLE "loads" ALTER COLUMN "delivery_date" DROP NOT NULL;
ALTER TABLE "loads" ALTER COLUMN "load_type" DROP NOT NULL;
ALTER TABLE "loads" ALTER COLUMN "rate" DROP NOT NULL;
ALTER TABLE "loads" ADD COLUMN "needs_review" BOOLEAN NOT NULL DEFAULT false;
