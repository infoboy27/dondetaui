#!/bin/sh
# Runs independently of the app (via cron, see deploy/uptime-check.crontab)
# so it still fires even if the whole `dondeta` compose stack is down --
# the in-app alerting (apps/api/src/common) can only report problems while
# the API process itself is alive to report them.
#
# Debounced with a state file so a real outage sends exactly one "down"
# alert and one "recovered" alert, not one per cron tick.
set -eu

URL="${DONDETA_HEALTH_URL:-https://dondeta.com.do/api/health}"
WEBHOOK="${DISCORD_WEBHOOK_ALERTS:?DISCORD_WEBHOOK_ALERTS must be set}"
STATE_FILE="${DONDETA_UPTIME_STATE_FILE:-$HOME/.dondeta-uptime-state}"

notify() {
  curl -s -X POST -H 'Content-Type: application/json' \
    -d "{\"content\": \"$1\"}" \
    "$WEBHOOK" >/dev/null 2>&1 || true
}

was_down=0
[ -f "$STATE_FILE" ] && was_down=1

if curl -fsS --max-time 10 "$URL" >/dev/null 2>&1; then
  if [ "$was_down" = "1" ]; then
    notify "✅ **dondeta.com.do se recuperó** ($URL responde de nuevo)"
    rm -f "$STATE_FILE"
  fi
else
  if [ "$was_down" = "0" ]; then
    notify "🔻 **dondeta.com.do no responde** ($URL) -- revisando"
    touch "$STATE_FILE"
  fi
fi
