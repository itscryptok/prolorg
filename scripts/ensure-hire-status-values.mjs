// Build-time helper: adds the Big/MVP HireStatus enum values idempotently.
//
// WHY THIS EXISTS: Postgres does not allow `ALTER TYPE ... ADD VALUE`
// inside a transaction block, and `prisma migrate deploy` wraps every
// migration file in a transaction. Keeping those statements in
// prisma/migrations/0005_big_mvp/migration.sql made the Render build fail
// with "Exited with status 1" (three failed deploys on 2026-09-30).
// node-postgres runs each query in its own implicit transaction
// (auto-commit), so the statements succeed here. The Render buildCommand
// runs this script BEFORE `prisma migrate deploy`, which the migration
// depends on: 0005 sets a column DEFAULT of 'REQUESTED', and Postgres
// validates a new enum default against the existing enum values.
//
// Safe to run on every build: IF NOT EXISTS + guarded to the `prolorg`
// database only (mirrors the buildCommand's dbname check).
import pg from "pg";

const { Client } = pg;

const VALUES = ["REQUESTED", "ACCEPTED", "IN_PROGRESS"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("ensure-hire-status-values: no DATABASE_URL, skipping.");
    return;
  }
  let dbname = "";
  try {
    dbname = new URL(url).pathname.replace(/^\//, "").split("?")[0];
  } catch {
    console.log("ensure-hire-status-values: could not parse DATABASE_URL, skipping.");
    return;
  }
  if (dbname !== "prolorg") {
    console.log(`ensure-hire-status-values: dbname is '${dbname}', not 'prolorg' — skipping.`);
    return;
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    for (const v of VALUES) {
      await client.query(`ALTER TYPE "HireStatus" ADD VALUE IF NOT EXISTS '${v}'`);
      console.log(`ensure-hire-status-values: ensured HireStatus '${v}'.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("ensure-hire-status-values FAILED:", err?.message ?? err);
  process.exit(1);
});
