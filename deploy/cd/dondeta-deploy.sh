#!/usr/bin/env bash
# DóndeTa continuous deployment (2026-10-10).
#
# Lives on the server at ~/dondeta-deploy/dondeta-deploy.sh and is the ONLY
# thing the GitHub Actions key can run: authorized_keys pins it with
# command="..." and no pty/forwarding, so a leaked key can't open a shell.
# Same pattern as ~/portal-deploy (Portal Proveedores). The requested action
# arrives in SSH_ORIGINAL_COMMAND:
#
#   deploy <sha>                 every stack -> <sha> (must be on origin/main),
#                                rebuild, health-check; a stack that fails its
#                                check goes back to its previous commit.
#   status                       commit deployed on each stack.
#   rollback <stack>             <stack> back to the commit before its last deploy.
#   merge-products <stack> [apply]
#                                runs merge-products.cli.js (dry run unless "apply").
#
# Only code changes. .env, docker-compose.override.yml and backups/ are
# untracked per stack and survive `git reset --hard`. Migrations run through
# the compose `migrate` service the api depends on; they are additive by
# convention, so a code rollback after a migration is safe.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
STACKS=(dondeta dondeta-co dondeta-mx)
LOG="$HERE/deploy.log"
STATE="$HERE/state"
mkdir -p "$STATE"

log() { echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') $*" | tee -a "$LOG" >&2; }
fail() { log "ERROR: $*"; exit 1; }

valid_stack() {
  local s
  for s in "${STACKS[@]}"; do [ "$s" = "$1" ] && return 0; done
  return 1
}

env_value() {
  # $1 stack dir, $2 key, $3 default
  local v
  v="$(grep -E "^$2=" "$1/.env" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d "\"' ")"
  echo "${v:-$3}"
}

healthy() {
  local dir="$1" port i
  port="$(env_value "$dir" WEB_PORT 8080)"
  for i in $(seq 1 40); do
    if curl -fsS -m 5 -o /dev/null "http://127.0.0.1:$port/healthz" &&
       curl -fsS -m 10 -o /dev/null "http://127.0.0.1:$port/api/health" &&
       curl -fsS -m 10 -o /dev/null "http://127.0.0.1:$port/"; then
      return 0
    fi
    sleep 3
  done
  return 1
}

# ingestion-worker / alerts-worker / backup sit behind compose profiles, so a
# plain build/up skips them and they keep running the old image. Include
# exactly the profiles whose service is already running on this stack --
# never switch on a service a stack wasn't running.
active_profiles() {
  local dir="$1" running args=""
  running="$(cd "$dir" && docker compose ps --services --status running 2>/dev/null || true)"
  grep -qx ingestion-worker <<<"$running" && args="$args --profile ingestion"
  grep -qx alerts-worker <<<"$running" && args="$args --profile alerts"
  grep -qx backup <<<"$running" && args="$args --profile backup"
  echo "$args"
}

build_and_up() {
  local dir="$1" profiles
  profiles="$(active_profiles "$dir")"
  # shellcheck disable=SC2086
  (cd "$dir" && docker compose $profiles build --quiet && docker compose $profiles up -d) >>"$LOG" 2>&1
  # nginx.conf may be bind-mounted; make sure the running nginx has it.
  (cd "$dir" && docker compose exec -T web nginx -s reload) >>"$LOG" 2>&1 || true
}

deploy_stack() {
  local stack="$1" sha="$2" dir="$HOME/$1" prev
  cd "$dir"
  prev="$(git rev-parse HEAD)"
  git fetch -q origin main
  git merge-base --is-ancestor "$sha" origin/main || { log "$stack: $sha is not on origin/main"; return 1; }
  if [ "$prev" = "$(git rev-parse "$sha")" ] && [ -z "$(git status --porcelain --untracked-files=no)" ] && healthy "$dir"; then
    log "$stack: already at ${sha:0:7}, healthy"
    return 0
  fi
  echo "$prev" >"$STATE/$stack.previous"
  log "$stack: ${prev:0:7} -> ${sha:0:7}"
  git reset -q --hard "$sha"
  build_and_up "$dir"
  if healthy "$dir"; then
    date -u '+%Y-%m-%dT%H:%M:%SZ' >"$STATE/$stack.deployed_at"
    log "$stack: healthy at ${sha:0:7}"
    return 0
  fi
  log "$stack: health check FAILED at ${sha:0:7}, rolling back to ${prev:0:7}"
  git reset -q --hard "$prev"
  build_and_up "$dir"
  if healthy "$dir"; then log "$stack: rolled back, healthy"; else log "$stack: STILL UNHEALTHY after rollback"; fi
  return 1
}

status() {
  local s first=1
  printf '{'
  for s in "${STACKS[@]}"; do
    [ $first -eq 1 ] || printf ','
    first=0
    printf '"%s":{"sha":"%s","deployed_at":"%s"}' "$s" \
      "$(git -C "$HOME/$s" rev-parse --short HEAD 2>/dev/null)" \
      "$(cat "$STATE/$s.deployed_at" 2>/dev/null)"
  done
  printf '}\n'
}

read -r ACTION ARG1 ARG2 _ <<<"${SSH_ORIGINAL_COMMAND:-${*:-status}}"

exec 9>"$HERE/.lock"
flock -w 1800 9 || fail "another deploy is running"

case "$ACTION" in
  deploy)
    [[ "${ARG1:-}" =~ ^[0-9a-f]{7,40}$ ]] || fail "usage: deploy <sha>"
    failed=0
    for s in "${STACKS[@]}"; do
      [ -d "$HOME/$s/.git" ] || { log "$s: not present, skipped"; continue; }
      deploy_stack "$s" "$ARG1" || failed=1
    done
    status
    exit $failed
    ;;
  status)
    status
    ;;
  rollback)
    valid_stack "${ARG1:-}" || fail "usage: rollback <stack>"
    prev="$(cat "$STATE/$ARG1.previous" 2>/dev/null)" || fail "$ARG1: no previous commit recorded"
    cd "$HOME/$ARG1" && git reset -q --hard "$prev"
    build_and_up "$HOME/$ARG1"
    healthy "$HOME/$ARG1" || fail "$ARG1: unhealthy after rollback"
    log "$ARG1: rolled back to ${prev:0:7}"
    status
    ;;
  merge-products)
    valid_stack "${ARG1:-}" || fail "usage: merge-products <stack> [apply]"
    flag=""
    [ "${ARG2:-}" = "apply" ] && flag="--apply"
    cd "$HOME/$ARG1"
    log "$ARG1: merge-products ${flag:-(dry run)}"
    docker compose run --rm -T --entrypoint node ingestion-worker dist/ingestion/merge-products.cli.js $flag 2>&1 | tee -a "$LOG"
    ;;
  *)
    fail "unknown action: $ACTION"
    ;;
esac
