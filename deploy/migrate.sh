#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
create table if not exists schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);
SQL

for file in $(find /migrations -maxdepth 1 -type f -name '*.sql' | sort); do
  name=$(basename "$file")

  if [ "$name" = "002_seed_dev.sql" ] && [ "${LOAD_DEV_SEED:-false}" != "true" ]; then
    echo "[migrate] skipping dev seed $name"
    continue
  fi

  already=$(psql "$DATABASE_URL" -Atc "select 1 from schema_migrations where filename = '$name' limit 1")
  if [ "$already" = "1" ]; then
    echo "[migrate] already applied $name"
    continue
  fi

  echo "[migrate] applying $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "insert into schema_migrations(filename) values ('$name') on conflict do nothing"
done

echo "[migrate] complete"
