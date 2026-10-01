-- Prolorg — sample work entries for expert profiles.
-- Title + description + optional image only; no URL (contact lockdown).

CREATE TABLE "ExpertSample" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" BYTEA,
    "imageMime" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertSample_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ExpertSample" ADD CONSTRAINT "ExpertSample_expertId_fkey"
    FOREIGN KEY ("expertId") REFERENCES "ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ExpertSample_expertId_sortOrder_idx" ON "ExpertSample"("expertId", "sortOrder");
