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

RETAILERS="exito alkosto ktronix falabella-co"

while true; do
  # Oldest data first (and close runs a restart cut off) -- deploys restart
  # this loop, and a fixed order starved the retailers at the end of it.
  ORDER=$(node dist/ingestion/ingestion-order.cli.js $RETAILERS 2>/dev/null) || ORDER=$RETAILERS
  [ -n "$ORDER" ] || ORDER=$RETAILERS
  for retailer in $ORDER; do
    case $retailer in
      exito) run exito node dist/ingestion/vtex-api.cli.js exito ;;
      alkosto) run alkosto node dist/ingestion/algolia-api.cli.js alkosto ;;
      ktronix) run ktronix node dist/ingestion/algolia-api.cli.js ktronix ;;
      falabella-co) run falabella-co node dist/ingestion/falabella.cli.js falabella-co ;;
    esac
  done

  # Per-retailer summary; posts to Discord when a scraper broke or shrank.
  run report node dist/ingestion/ingestion-report.cli.js

  echo "[worker] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
