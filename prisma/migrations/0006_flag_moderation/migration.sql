-- AiProlice moderation: flag counts + deactivation.
--
-- Adds per-expert "Flag this pro" report counts and a deactivation switch
-- that hides an AI pro from the /experts directory and /watch feed.

ALTER TABLE "ExpertProfile" ADD COLUMN IF NOT EXISTS "flagCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExpertProfile" ADD COLUMN IF NOT EXISTS "isDeactivated" BOOLEAN NOT NULL DEFAULT FALSE;
