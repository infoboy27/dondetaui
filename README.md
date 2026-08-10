# DóndeTa UI

DóndeTa is a Dominican Republic product price-comparison experience focused on helping shoppers find where a product is cheaper, compare offers, track prices and eventually scan barcodes in-store.

## Status

This repository currently contains the Figma Make implementation that serves as the **visual reference for DóndeTa v1**.

The current UI is a React + Vite + Tailwind prototype. The production migration plan lives in `docs/ARCHITECTURE.md`. Visual rules live in `docs/DESIGN_SYSTEM.md` and coding-agent rules live in `AGENTS.md`.

## Local development

Requirements:

- Node.js 22+
- pnpm 10.34.3+

Install and run:

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm typecheck
pnpm build
pnpm check
```

## Environment

Copy `.env.example` to `.env.local` when API integration starts.

```bash
cp .env.example .env.local
```

Current variable:

- `VITE_API_BASE_URL` — future backend/API base URL.

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
