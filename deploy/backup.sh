#!/bin/sh
set -eu

INTERVAL_SECONDS=${BACKUP_INTERVAL_SECONDS:-86400}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
BACKUP_DIR=/backups

mkdir -p "$BACKUP_DIR"

while true; do
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  file="$BACKUP_DIR/dondeta-$stamp.sql.gz"

  echo "[backup] starting dump at $(date -u +%FT%TZ)"
  if pg_dump "$DATABASE_URL" | gzip > "$file"; then
    echo "[backup] wrote $file ($(du -h "$file" | cut -f1))"
  else
    echo "[backup] pg_dump failed; removing partial file" >&2
    rm -f "$file"
  fi

  find "$BACKUP_DIR" -name 'dondeta-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
  echo "[backup] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
