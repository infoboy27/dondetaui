# DóndeTa Production Architecture

This document defines the target production architecture while preserving the current Figma Make app as the visual reference implementation.

## Current state

The repository currently contains a Figma Make prototype built with React, TypeScript, Vite and Tailwind CSS.

That prototype is valuable because it already encodes:

- approved brand direction
- mobile navigation
- price comparison hierarchy
- product detail structure
- scanner experience
- alerts/favorites behavior
- nearby stores concept
- desktop comparison layout

It should not be discarded. It should be treated as the visual reference while production code is introduced in controlled steps.

## Target repository shape

Long term, DóndeTa should converge toward a monorepo structure like:

```text
dondeta/
├── apps/
│   ├── web/          # Next.js production web
│   ├── mobile/       # Expo / React Native
│   └── api/          # NestJS API
├── packages/
│   ├── ui/           # shared design primitives where practical
│   ├── tokens/       # design tokens
│   ├── types/        # shared domain/contracts
│   ├── validation/   # schemas
│   └── api-client/   # typed client
├── docs/
│   ├── DESIGN_SYSTEM.md
│   └── ARCHITECTURE.md
└── AGENTS.md
```

Do not perform this migration as a single rewrite. Migrate in small, visually verified slices.

## Domain model

Production should distinguish canonical products from retailer offers.

### Product

Represents the consumer-facing product family.

Suggested fields:

- id
- brand
- name
- category
- description

### ProductVariant

Represents the exact comparable model/variant.

Suggested fields:

- id
- productId
- model
- upc
- ean
- manufacturerSku
- normalizedAttributes

### Retailer

Represents a merchant brand.

Suggested fields:

- id
- name
- slug
- logoUrl
- websiteUrl
- primaryColor

### Store

Represents a physical branch or fulfillment location.

Suggested fields:

- id
- retailerId
- name
- address
- latitude
- longitude

### Offer

Represents a retailer/store offer for an exact product variant.

Suggested fields:

- id
- productVariantId
- retailerId
- storeId
- externalSku
- url
- price
- shippingPrice
- totalPrice
- availability
- lastSeenAt

### PriceObservation

Historical observation for one offer.

Suggested fields:

- id
- offerId
- price
- shippingPrice
- availability
- observedAt

### User entities

Additional production entities:

- User
- Favorite
- PriceAlert
- ShoppingList
- ShoppingListItem

## Offer ranking

Do not rank solely by listed product price.

The eventual ranking function should be able to consider:

- product price
- shipping/delivery cost
- availability
- pickup options
- distance where relevant
- membership constraints where relevant
- freshness of observation

At minimum, production code should calculate or receive a deterministic `totalPrice` and should not assume array order means best price.

## Product matching

Matching is one of the core product risks.

Preferred matching order:

1. exact UPC/EAN
2. exact manufacturer model
3. deterministic normalized attributes
4. fuzzy/AI-assisted candidate generation
5. human review for uncertain cases

Do not compare two variants as the same exact product when confidence is insufficient.

## Data ingestion architecture

Target flow:

```text
Retailer source
  -> ingestion worker
  -> raw retailer record
  -> normalization
  -> canonical product matching
  -> offer upsert
  -> price observation
  -> search/index refresh
  -> API
  -> web/mobile
```

Preferred retailer data sources:

1. official API/feed
2. affiliate/partner feed
3. permitted structured JSON/HTML
4. browser automation only when necessary and permitted

The UI must remain unaware of retailer scraping implementation details.

## API boundary

Initial API surface can look like:

```http
GET /products
GET /products/:id
GET /search?q=
GET /products/:id/offers
GET /products/:id/history
GET /stores
GET /stores/:id
POST /alerts
GET /alerts
GET /favorites
POST /favorites
DELETE /favorites/:id
```

The first implementation may use deterministic fixtures. Replace fixture repositories with PostgreSQL repositories behind the same service/API contracts.

## Search

Start simple and observable.

Phase 1:

- PostgreSQL text search
- `pg_trgm` for tolerant matching

Later, if scale/UX requires it:

- Meilisearch or another dedicated search engine

Do not add search infrastructure before measuring a concrete need.

## Background jobs

Redis + BullMQ (or equivalent) is appropriate for:

- retailer refresh jobs
- matching queues
- price-alert evaluation
- stale-offer cleanup
- retries/backoff

Workers should be idempotent.

## Web

Target production web: Next.js + TypeScript.

Use real routes for shareable/deep-linkable product pages:

- `/`
- `/search`
- `/product/[slug]`
- `/stores/[slug]`
- `/stores/nearby`
- `/alerts`
- `/profile`

The current Vite/Figma Make app may remain in place during the transition as the comparison reference.

## Mobile

Target mobile: Expo / React Native.

Mobile-specific production capabilities:

- barcode scanner
- push notifications
- geolocation
- deep links
- store proximity

The mobile UI should use the same tokens and information hierarchy as the approved web/Figma reference.

## Barcode flow

Target flow:

```text
Camera
  -> UPC/EAN
  -> API barcode lookup
  -> ProductVariant
  -> ranked offers
  -> comparison screen
```

The current scanner is a visual simulation and should remain isolated from production scanning logic.

## Maps

The current nearby-stores map is a visual placeholder.

Production should use a real map provider and real store coordinates. Map/provider-specific logic should live behind a small location/map integration layer rather than leak through product components.

## Price history

Production history must be deterministic and database-backed.

Do not generate randomized price history in production, seeded fixtures used for visual regression, or automated screenshots.

## Freshness

Every offer should track observation time.

The UI should be able to communicate:

- fresh
- stale
- unavailable
- last seen

Suggested first-pass refresh strategy:

- high-interest/alerted products: more frequent
- normal catalog: periodic
- low-interest products: slower cadence/on-demand

Exact cadence belongs in ingestion operations, not frontend logic.

## Migration strategy

### Phase 1 — foundation

- document visual source of truth
- document architecture
- introduce typed design tokens
- no visual changes

### Phase 2 — component extraction

Extract reusable primitives while preserving screenshots:

- Button
- SearchField
- Card
- ProductCard
- StoreOfferRow
- badges
- BottomNavigation

### Phase 3 — web production shell

Introduce Next.js production web and port Home first.

### Phase 4 — visual regression

Create deterministic fixture data and Playwright screenshots for key screens.

### Phase 5 — API fixtures

Introduce NestJS contracts/API with fixture-backed repositories.

### Phase 6 — PostgreSQL

Replace fixture persistence with database repositories/migrations.

### Phase 7 — first retailer integration

Integrate one retailer end-to-end before adding several.

### Phase 8 — Android/mobile

Build Expo application using stable API contracts and approved design tokens.

## Definition of safe refactor

A structural refactor is successful when:

- the build passes
- TypeScript remains strict
- the approved screens are visually equivalent
- mock flows continue to work
- domain/UI coupling is reduced
- no retailer-specific ingestion logic enters the UI
