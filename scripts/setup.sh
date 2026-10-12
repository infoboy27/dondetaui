#!/usr/bin/env bash
# Prepares a fresh clone for development on macOS, Linux or Windows (Git Bash).
#
#   git lfs install && git clone https://github.com/infoboy27/dondetaui.git
#   cd dondetaui && bash scripts/setup.sh
#
# Each app has its own pnpm lockfile (there is no workspace), so each one is
# installed on its own. Safe to run again: it never overwrites an existing
# .env file. Pass --no-mobile to skip the Expo app, --e2e to also download
# the Playwright browser.
set -euo pipefail

cd "$(dirname "$0")/.."

mobile=1
e2e=0
for arg in "$@"; do
  case "$arg" in
    --no-mobile) mobile=0 ;;
    --e2e) e2e=1 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$*"; }

step "Checking tools"
node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$node_major" -lt 22 ]; then
  echo "Node 22+ is required (found: $(node -v 2>/dev/null || echo none)). With mise: mise install" >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm through corepack"
  corepack enable
  corepack prepare pnpm@10.34.3 --activate
fi
echo "node $(node -v), pnpm $(pnpm -v)"

# Images are in Git LFS (see .gitattributes). Without git-lfs a clone holds
# 130-byte pointer files instead of the PNGs.
if git lfs version >/dev/null 2>&1; then
  git lfs install --local >/dev/null
  git lfs pull
else
  warn "git-lfs is not installed: images outside public/ and src/assets/ will be pointer files."
  warn "Install it (brew install git-lfs / apt install git-lfs), then: git lfs install && git lfs pull"
fi

copy_env() {
  local example=$1 target=$2
  if [ -f "$target" ]; then
    echo "$target already exists, left as is"
  else
    cp "$example" "$target"
    echo "created $target from $example"
  fi
}

step "Web app (root)"
pnpm install --frozen-lockfile
copy_env .env.example .env.local

step "API (apps/api)"
(cd apps/api && pnpm install --frozen-lockfile)
copy_env apps/api/.env.example apps/api/.env

step "SEO site (apps/web-seo)"
(cd apps/web-seo && pnpm install --frozen-lockfile)

if [ "$mobile" -eq 1 ]; then
  step "Mobile app (apps/mobile)"
  (cd apps/mobile && pnpm install --frozen-lockfile)
  if [ ! -f apps/mobile/.env ]; then
    # Production API by default: the app works without running the backend.
    printf 'EXPO_PUBLIC_API_URL=https://dondeta.com.do/api\n' > apps/mobile/.env
    echo "created apps/mobile/.env pointing at the production API"
  fi
fi

if [ "$e2e" -eq 1 ]; then
  step "Playwright browser"
  pnpm exec playwright install chromium
fi

step "Checking the web app"
pnpm check

cat <<'EOF'

Ready. Next steps are in docs/HANDOFF.md:
  pnpm dev                                # web app on http://localhost:8443 (mock data)
  pnpm dev:prod-data                      # same, against the production API
  cd apps/mobile && pnpm start            # Expo (Expo Go / dev client)
  cd apps/mobile && pnpm ios              # iOS simulator (macOS + Xcode)
EOF
