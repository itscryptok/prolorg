-- AiProlice seed-profile visibility (Yemi 2026-10-02).
--
-- Adds ExpertProfile.isSeed: marks test/seed profiles (e.g. the QA accounts).
-- Seed profiles stay visible as demo content until 10 real humans have signed
-- up (synthetic test accounts use @example.com and are excluded from the
-- count); after that they are hidden from the public directory and /watch.
ALTER TABLE "ExpertProfile" ADD COLUMN "isSeed" BOOLEAN NOT NULL DEFAULT false;
