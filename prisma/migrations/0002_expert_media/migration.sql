-- Prolorg — expert media for onboarding uploads.
-- Stores profile photos and intro videos as binary so uploads survive
-- deploys without extra storage services. Served via
-- /api/experts/media/[expertId]/[kind].

-- CreateTable
CREATE TABLE "ExpertMedia" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertMedia_expertId_kind_key" ON "ExpertMedia"("expertId", "kind");

-- AddForeignKey
ALTER TABLE "ExpertMedia" ADD CONSTRAINT "ExpertMedia_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
