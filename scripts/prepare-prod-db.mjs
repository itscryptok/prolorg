// Build-time helper for Render: makes `prisma migrate deploy` resilient.
//
// Runs BEFORE `npx prisma migrate deploy` in the Render buildCommand.
// 1. Clears any failed/unresolved migration records from _prisma_migrations
//    (equivalent of `prisma migrate resolve --rolled-back`, but with visible
//    logging and no silent failure — the CLI step was swallowed by `|| true`
//    and never cleared the failed 0005_big_mvp record, causing P3009).
//    A failed migration is rolled back by Postgres (migrations run in a
//    transaction), so deleting its record is safe: deploy re-applies it.
// 2. Adds the Big/MVP HireStatus enum values idempotently. Postgres forbids
//    ALTER TYPE ... ADD VALUE inside a transaction, and migrate deploy wraps
//    each migration in one — so these must run here (auto-commit), not in
//    0005_big_mvp/migration.sql. 0005 sets a column DEFAULT of 'REQUESTED',
//    which Postgres validates against the enum, so the values must exist
//    BEFORE migrate deploy runs.
//
// Guarded to Prolorg's database only. Exits non-zero on real failure so
// the build log shows what happened.
//
// Detection: Prolorg may live in a dedicated `prolorg` database OR in the
// shared database (it shares the paid Postgres server with REMU). We treat
// it as Prolorg's database if the dbname is `prolorg` OR if Prolorg's
// `ExpertProfile` table already exists there. Prints PROCEED or SKIP as the
// last line so the build script knows whether to run `migrate deploy`.
import pg from "pg";

const { Client } = pg;
const ENUM_VALUES = ["REQUESTED", "ACCEPTED", "IN_PROGRESS"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("prepare-prod-db: no DATABASE_URL, skipping.");
    console.log("prepare-prod-db: SKIP");
    return;
  }
  let dbname = "";
  try {
    dbname = new URL(url).pathname.replace(/^\//, "").split("?")[0];
  } catch {
    console.log("prepare-prod-db: could not parse DATABASE_URL, skipping.");
    console.log("prepare-prod-db: SKIP");
    return;
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  let isProlorgDb = dbname === "prolorg";
  if (!isProlorgDb) {
    try {
      const tbl = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_name = 'ExpertProfile' LIMIT 1"
      );
      isProlorgDb = (tbl.rowCount ?? 0) > 0;
    } catch {
      isProlorgDb = false;
    }
  }
  if (!isProlorgDb) {
    console.log(
      `prepare-prod-db: not Prolorg's database (dbname='${dbname}', no ExpertProfile table) — skipping.`
    );
    console.log("prepare-prod-db: SKIP");
    await client.end();
    return;
  }
  console.log(`prepare-prod-db: confirmed Prolorg's database (dbname='${dbname}').`);
  try {
    const failed = await client.query(
      `SELECT migration_name, started_at FROM "_prisma_migrations"
       WHERE finished_at IS NULL AND rolled_back_at IS NULL
       ORDER BY started_at`
    );
    if (failed.rowCount === 0) {
      console.log("prepare-prod-db: no failed migrations recorded.");
    } else {
      for (const r of failed.rows) {
        console.log(`prepare-prod-db: clearing failed migration record '${r.migration_name}' (started ${r.started_at}).`);
      }
      await client.query(
        `DELETE FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`
      );
      console.log(`prepare-prod-db: cleared ${failed.rowCount} failed migration record(s).`);
    }

    for (const v of ENUM_VALUES) {
      await client.query(`ALTER TYPE "HireStatus" ADD VALUE IF NOT EXISTS '${v}'`);
      console.log(`prepare-prod-db: ensured HireStatus '${v}'.`);
    }
    console.log("prepare-prod-db: done.");
    console.log("prepare-prod-db: PROCEED");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("prepare-prod-db FAILED:", err?.message ?? err);
  process.exit(1);
});
