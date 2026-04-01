#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SQL_INIT="$ROOT/db/init/001_init.sql"
SQL_SEED="$ROOT/db/seed/001_seed.sql"

if [[ ! -f "$SQL_INIT" ]]; then
  echo >&2 "Missing init SQL: $SQL_INIT"
  exit 1
fi

echo "Applying schema: $SQL_INIT"
docker exec -i qontai-pg psql -U qontai -d qontai -v ON_ERROR_STOP=1 < "$SQL_INIT"

if [[ -f "$SQL_SEED" ]]; then
  echo "Applying seed: $SQL_SEED"
  docker exec -i qontai-pg psql -U qontai -d qontai -v ON_ERROR_STOP=1 < "$SQL_SEED"
fi

echo "Done. Current tables:"
docker exec -i qontai-pg psql -U qontai -d qontai -c "\\dt"

