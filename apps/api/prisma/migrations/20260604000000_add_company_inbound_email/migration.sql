-- AlterTable
ALTER TABLE "companies" ADD COLUMN "inbound_email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "companies_inbound_email_key" ON "companies"("inbound_email");
