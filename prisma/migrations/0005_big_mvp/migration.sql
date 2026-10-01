-- AiProlice Big/MVP migration.
--
-- Adds server-side sessions, contact-evasion violation logging, account
-- blocking, the REQUESTED / ACCEPTED / IN_PROGRESS hire statuses, hire
-- agreement text, and review authorship (one review per completed hire).
-- Also removes the junk PENDING test profile (slug 'test').

-- New hire statuses used by the Big/MVP hire flow.
-- NOTE: the ALTER TYPE ... ADD VALUE statements for REQUESTED / ACCEPTED /
-- IN_PROGRESS intentionally live OUTSIDE this migration. Postgres forbids
-- ALTER TYPE ... ADD VALUE inside a transaction block, and `prisma migrate
-- deploy` wraps every migration in one transaction, so keeping them here
-- fails the Render build. They are added idempotently (IF NOT EXISTS) by
-- scripts/ensure-hire-status-values.mjs, which the Render buildCommand runs
-- BEFORE `prisma migrate deploy` (each statement auto-commits).

-- Sessions: the session token lives in an httpOnly cookie; only its
-- SHA-256 hash is stored here.
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Violations: every inbox message that trips contact-evasion detection is
-- logged here for admin review (block repeat offenders from /addy).
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "reasons" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Violation_userId_idx" ON "Violation"("userId");
CREATE INDEX "Violation_createdAt_idx" ON "Violation"("createdAt");
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Account blocking (repeat contact-evasion offenders).
ALTER TABLE "User" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- Hire agreement text + Big/MVP default status.
ALTER TABLE "HireRequest" ADD COLUMN "agreement" TEXT;
ALTER TABLE "HireRequest" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';

-- Review authorship + one review per completed hire.
ALTER TABLE "Review" ADD COLUMN "authorId" TEXT;
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_hireRequestId_key" UNIQUE ("hireRequestId");

-- Junk cleanup: the PENDING test profile (slug 'test') created during
-- development. Media/samples cascade-delete with the profile.
DELETE FROM "ExpertProfile" WHERE "slug" = 'test' AND "status" = 'PENDING';
