#!/usr/bin/env bash
# Render build for prolorg. Kept as a script (instead of inline in render.yaml)
# because shell quoting inside YAML kept breaking the Blueprint sync.
set -euo pipefail

# npm install (not ci): no lockfile is generated in this sandbox;
# Render's network reaches the registry.
npm install
npx prisma generate

if [ -n "${DATABASE_URL:-}" ]; then
  # prepare-prod-db detects Prolorg's database (dedicated `prolorg` db OR the
  # shared db containing Prolorg's tables) and prints PROCEED as its last
  # line when migrations should run.
  set +e
  node scripts/prepare-prod-db.mjs > /tmp/prepare-prod-db.log 2>&1
  prep_status=$?
  set -e
  cat /tmp/prepare-prod-db.log
  if [ "$prep_status" -eq 0 ] && grep -q "prepare-prod-db: PROCEED" /tmp/prepare-prod-db.log; then
    npx prisma migrate deploy
  else
    echo "skipping migrate deploy (prepare-prod-db status=$prep_status; see log above)"
  fi
fi

npm run build
