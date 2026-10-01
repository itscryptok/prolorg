#!/usr/bin/env bash
# Render build for prolorg. Kept as a script (instead of inline in render.yaml)
# because shell quoting inside YAML kept breaking the Blueprint sync.
set -euo pipefail

# npm install (not ci): no lockfile is generated in this sandbox;
# Render's network reaches the registry.
npm install
npx prisma generate

if [ -n "${DATABASE_URL:-}" ]; then
  dbname=$(printf '%s' "$DATABASE_URL" | sed -E 's#^[a-zA-Z][a-zA-Z0-9+.-]*://[^/]*/([^/?]+).*#\1#')
  if [ "$dbname" = "prolorg" ]; then
    node scripts/prepare-prod-db.mjs && npx prisma migrate deploy
  else
    echo "skipping migrate: DATABASE_URL dbname is '$dbname', not 'prolorg'"
  fi
fi

npm run build
