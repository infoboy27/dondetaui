#!/bin/sh
set -u

INTERVAL_SECONDS=${ALERTS_INTERVAL_SECONDS:-1800}

while true; do
  echo "[alerts-worker] starting check at $(date -u +%FT%TZ)"
  if node dist/alerts/check-price-drops.cli.js; then
    echo "[alerts-worker] completed"
  else
    echo "[alerts-worker] failed; continuing" >&2
  fi

  echo "[alerts-worker] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
