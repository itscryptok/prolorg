-- AiProlice separated flag system: payment-practice flags vs member flags.
--
-- - Adds ExpertProfile.paymentFlagCount for auto-detected payment-detail
--   violations committed by the pro (kept separate from the public
--   "Flag this pro" member count).
-- - Adds FlagReport: one row per flag with kind (USER | PAYMENT), the
--   reporting member's username, and the details text, so /addy can show
--   a flag-details column.

ALTER TABLE "ExpertProfile" ADD COLUMN IF NOT EXISTS "paymentFlagCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "FlagReport" (
  "id" TEXT NOT NULL,
  "expertId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "reporterName" TEXT,
  "reporterId" TEXT,
  "details" TEXT,
  "reasons" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FlagReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FlagReport_expertId_createdAt_idx" ON "FlagReport"("expertId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FlagReport_expertId_fkey'
  ) THEN
    ALTER TABLE "FlagReport"
      ADD CONSTRAINT "FlagReport_expertId_fkey"
      FOREIGN KEY ("expertId") REFERENCES "ExpertProfile"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
