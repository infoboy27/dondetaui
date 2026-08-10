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
  run sirena node dist/ingestion/retailer.cli.js sirena
  run corripio node dist/ingestion/retailer.cli.js corripio
  run pricesmart node dist/ingestion/pricesmart.cli.js

  echo "[worker] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
