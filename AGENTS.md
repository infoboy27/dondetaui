# DóndeTa — Agent Guide

This repository contains the Figma Make implementation of **DóndeTa**, a Dominican Republic product price-comparison platform.

## Source of truth

The current Figma Make application is the **visual source of truth** for DóndeTa v1.

Agents may refactor implementation details, extract reusable components, improve accessibility, add tests, add data/API layers, and migrate architecture, but they must **not redesign the product unless explicitly asked**.

Preserve visual output when doing structural work:

- colors
- typography
- spacing
- border radii
- shadows
- card proportions
- information hierarchy
- mobile bottom navigation
- price-comparison emphasis
- responsive behavior

If a refactor changes the visual result unintentionally, treat it as a regression.

## Brand rules

Primary brand tokens are documented in `docs/DESIGN_SYSTEM.md` and mirrored in `src/index.css` and `src/design/tokens.ts`.

Core colors:

- Primary green: `#00B894`
- Primary light / mint: `#E6F7F3`
- Accent orange: `#FF9F1C`
- Yellow: `#FFD166`
- Deep navy: `#0F1D2D`
- App background: `#F2F4F7`
- Card: `#FFFFFF`
- Border: `#E8EDF2`

Typography:

- Display/headings/prices: **Poppins**
- Body/interface: **DM Sans**

Price format must remain Dominican peso format, for example: `RD$24,495`.

## Current stack

The Figma Make prototype currently uses:

- React 19
- TypeScript
- Vite 8
- Tailwind CSS v4
- Figma Make runtime tooling

Do not replace this stack inside the prototype merely for preference. The production migration strategy is documented separately in `docs/ARCHITECTURE.md`.

## Current project structure

- `src/main.tsx` — React entrypoint
- `src/App.tsx` — prototype navigation/root composition
- `src/index.css` — global styles and current Tailwind theme tokens
- `src/components/` — reusable prototype components
- `src/components/ui/` — production-oriented UI primitives
- `src/screens/` — Figma Make screens
- `src/data/mock.ts` — deterministic mock product/store/price data
- `src/domain/offers.ts` — centralized offer ranking / purchase-total helpers
- `src/types.ts` — UI/domain contracts prepared for later API integration
- `src/design/tokens.ts` — typed mirror of the approved visual tokens
- `docs/DESIGN_SYSTEM.md` — approved visual rules
- `docs/ARCHITECTURE.md` — target production architecture and migration boundaries
- `.github/workflows/ci.yml` — typecheck/build validation

## Refactoring rules

1. **Do not redesign while refactoring.**
2. Prefer extracting repeated UI into reusable components over copying markup.
3. Prefer semantic domain names: `Product`, `ProductVariant`, `Retailer`, `Store`, `Offer`, `PriceObservation`, `PriceAlert`.
4. Do not assume `product.prices[0]` is always the cheapest offer in production code. Use `src/domain/offers.ts` or backend-provided ranking.
5. Do not assume listed price equals total purchase cost. Production ranking may include shipping/delivery and availability.
6. UI components should receive normalized data rather than know store-specific scraping details.
7. Store logos/colors must eventually come from retailer data, not hardcoded UI conditionals.
8. Keep mock data deterministic when used in visual tests. Avoid random values in screenshots or regression fixtures.
9. Add loading, empty, unavailable, error and stale-price states when connecting real APIs.
10. Preserve touch targets and keyboard/focus accessibility.
11. New shared UI must use typed design tokens when a token already exists.
12. Keep scraper/merchant integration code outside the UI repository boundary until the production backend workspace is introduced.

## Navigation

The current Figma Make prototype uses local React state to switch screens. That is acceptable for the visual prototype.

Production web should use real routes/deep links such as:

- `/`
- `/search?q=...`
- `/product/:slug`
- `/stores/:slug`
- `/stores/nearby`
- `/alerts`
- `/profile`

Do not introduce a router into the prototype unless the task explicitly requires it or the migration phase reaches production routing.

## Data boundary

The UI must not contain scraper logic.

Target flow:

`Retailer source -> ingestion worker -> normalization -> product matching -> database -> API -> DóndeTa UI`

The frontend should consume stable API contracts through an API client layer.

Structured offer data should prefer numeric fields such as `shippingCost` and `totalPrice`; text labels such as `shipping: "RD$500"` remain only as a prototype compatibility layer.

## Visual regression policy

Before approving a UI refactor, compare at minimum:

- Home
- Search / Results
- Product Detail
- Scanner

against the Figma Make reference at representative mobile and desktop widths.

Recommended production validation: Playwright screenshots with stable fixtures.

## Required checks

Before publishing code changes whenever the execution environment allows it:

```bash
pnpm typecheck
pnpm build
```

or run both with:

```bash
pnpm check
```

CI must remain green before merging future functional/refactor PRs.

## Code quality

- Keep TypeScript strict.
- Avoid `any` unless an integration boundary genuinely requires it.
- Keep components focused and testable.
- Prefer design tokens over new literal colors/radii/shadows.
- Use double quotes for strings containing apostrophes or escape apostrophes correctly.
- Ensure JSX tags and braces are balanced.
- Preserve Figma Make compatibility while this repository remains the active visual prototype.

## Change strategy

Prefer small, reviewable pull requests:

1. foundation/tokens/docs
2. reusable UI primitives
3. Home migration/refactor
4. Search/Results
5. Product Detail
6. data/API boundary
7. real routing
8. backend integrations
9. mobile implementation

Each PR should state whether it is expected to alter visual output. Structural PRs should default to **no visual change**.
