#!/bin/sh
set -u

INTERVAL_SECONDS=${INGESTION_INTERVAL_SECONDS:-21600}

run() {
  label=$1
  shift
  echo "[worker] starting $label at $(date -u +%FT%TZ)"
  if "$@"; then
    echo "[worker] completed $label"
  else
    echo "[worker] $label failed; continuing" >&2
  fi
}

while true; do
  run plaza-lama node dist/ingestion/plaza-lama.cli.js
  run jumbo node dist/ingestion/retailer.cli.js jumbo
  run sirena node dist/ingestion/vtex-api.cli.js sirena
  run corripio node dist/ingestion/retailer.cli.js corripio
  run pricesmart node dist/ingestion/pricesmart.cli.js

  # Safety net for cross-retailer duplicates that inline matching missed
  # (e.g. one store listed the product before the other existed).
  run merge-products node dist/ingestion/merge-products.cli.js --apply
  # Per-retailer summary; posts to Discord when a scraper broke or shrank.
  run report node dist/ingestion/ingestion-report.cli.js

  echo "[worker] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
