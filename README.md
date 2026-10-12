# DóndeTa UI

DóndeTa is a Dominican Republic product price-comparison experience focused on helping shoppers find where a product is cheaper, compare offers, track prices and eventually scan barcodes in-store.

## Start here

- **[docs/HANDOFF.md](docs/HANDOFF.md)** — clone + setup on a new machine, local commands, deploy, where secrets live, current state and next steps.
- [docs/MOBILE.md](docs/MOBILE.md) — Expo app (Android + iOS).
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [AGENTS.md](AGENTS.md), [TESTING.md](TESTING.md), [DEPLOY_DEV.md](DEPLOY_DEV.md).

Live at https://dondeta.com.do (plus dondeta.co / dondeta.mx stacks).

## Quick start

```bash
git lfs install
git clone https://github.com/infoboy27/dondetaui.git && cd dondetaui
bash scripts/setup.sh      # installs web, api, web-seo and mobile; creates local .env files
pnpm dev                   # web app with mock data on :8443
pnpm dev:prod-data         # web app against the production API
pnpm check                 # typecheck + build + tests (same as CI)
```

## Repository layout

| Path | What |
| --- | --- |
| `src/` | Vite/React SPA (dondeta.com.do, including `/admin`) |
| `apps/api` | NestJS API, ingestion workers, Instagram autopilot, SQL migrations |
| `apps/web-seo` | Next.js SEO pages (`/precios`, `/comparaciones`, …) |
| `apps/mobile` | Expo app (Android + iOS) |
| `deploy/` | server scripts, ingestion loops, CD script |
| `marketing/` | brand assets and published campaign pieces |

## Visual source of truth

Structural refactors must not redesign the product. The current Figma Make output is the visual source of truth until an explicitly approved design revision replaces it.

Preserve:

- DóndeTa green / orange / navy palette
- Poppins + DM Sans typography
- spacing and card proportions
- bottom navigation behavior
- comparison hierarchy and best-price emphasis
- mobile and desktop layouts

## Current application areas

- Home
- Search
- Results / price comparison
- Product detail
- Price history
- Alerts
- Barcode-scanner prototype
- Favorites/profile
- Nearby stores prototype
- Store detail
- Equipa tu Hogar prototype
- Desktop comparison view

## Architecture direction

The current prototype remains intentionally lightweight. Production architecture is planned around clear boundaries:

```text
Retailer source
  -> ingestion worker
  -> normalization
  -> product matching
  -> database
  -> API
  -> DóndeTa clients
```

The UI must never contain scraping logic.

See `docs/ARCHITECTURE.md` for the planned web/mobile/API architecture and migration phases.

## Pricing helpers

`src/domain/offers.ts` centralizes offer ranking rules so new production code does not assume that `prices[0]` is always the cheapest offer. It also provides a transition path toward ranking by purchase total rather than list price alone.

## Design tokens

Typed tokens live in:

```text
src/design/tokens.ts
```

Reusable UI primitives begin in:

```text
src/components/ui/
```

New components should prefer these tokens instead of introducing new literal colors, radii or shadows.

## CI

Pull requests and branch pushes run TypeScript checking and a production build through GitHub Actions.

## Contribution strategy

Prefer small, reviewable PRs. Foundation and refactor work should state whether visual output is expected to change. Unless explicitly approved, the default expectation is **no visual change**.
