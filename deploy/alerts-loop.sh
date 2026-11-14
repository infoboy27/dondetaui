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
  # Black Friday "ofertas reales" digest: a no-op outside its send days.
  node dist/digests/send-deal-digest.cli.js || echo "[alerts-worker] deal digest failed; continuing" >&2

  echo "[alerts-worker] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
