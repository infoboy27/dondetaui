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
  run exito node dist/ingestion/vtex-api.cli.js exito
  run alkosto node dist/ingestion/algolia-api.cli.js alkosto
  run ktronix node dist/ingestion/algolia-api.cli.js ktronix

  echo "[worker] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
