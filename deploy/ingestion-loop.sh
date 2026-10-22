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

RETAILERS="plaza-lama jumbo sirena corripio pricesmart cecomsa electrodom eneba"

while true; do
  # Oldest data first (and close runs a restart cut off) -- deploys restart
  # this loop, and a fixed order starved the retailers at the end of it.
  ORDER=$(node dist/ingestion/ingestion-order.cli.js $RETAILERS 2>/dev/null) || ORDER=$RETAILERS
  [ -n "$ORDER" ] || ORDER=$RETAILERS
  for retailer in $ORDER; do
    case $retailer in
      plaza-lama) run plaza-lama node dist/ingestion/plaza-lama.cli.js ;;
      jumbo) run jumbo node dist/ingestion/retailer.cli.js jumbo ;;
      sirena) run sirena node dist/ingestion/vtex-api.cli.js sirena ;;
      corripio) run corripio node dist/ingestion/retailer.cli.js corripio ;;
      cecomsa) run cecomsa node dist/ingestion/cecomsa.cli.js ;;
      electrodom) run electrodom node dist/ingestion/shopify.cli.js electrodom ;;
      pricesmart) run pricesmart node dist/ingestion/pricesmart.cli.js ;;
      eneba) run eneba env ENEBA_COUNTRY=do ENEBA_CURRENCY=DOP node dist/ingestion/eneba.cli.js ;;
    esac
  done

  # Brands a broken scraper stored on products nobody re-lists any more.
  run repair-brands node dist/ingestion/repair-brands.cli.js
  # Safety net for cross-retailer duplicates that inline matching missed
  # (e.g. one store listed the product before the other existed).
  run merge-products node dist/ingestion/merge-products.cli.js --apply
  # Per-retailer summary; posts to Discord when a scraper broke or shrank.
  run report node dist/ingestion/ingestion-report.cli.js

  echo "[worker] sleeping ${INTERVAL_SECONDS}s"
  sleep "$INTERVAL_SECONDS"
done
