#!/bin/sh
set -u

# Checks every few minutes whether a scheduled Instagram post is due; the CLI
# itself exits right away unless the autopilot is on (/admin/instagram).
INTERVAL_SECONDS=${IG_AUTOPILOT_INTERVAL_SECONDS:-600}

while true; do
  node dist/admin/instagram-autopilot.cli.js || echo "[ig-autopilot] run failed; continuing" >&2
  sleep "$INTERVAL_SECONDS"
done
