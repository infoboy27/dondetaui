# DóndeTa API

NestJS backend for the DóndeTa price-comparison platform.

## Local development

```bash
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres redis
cd apps/api
pnpm install
pnpm start:dev
```

API base URL: `http://localhost:3001/api`

## Current endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/search?q=`
- `GET /api/products/:id`
- `GET /api/products/:id/offers`
- `GET /api/products/:id/history`
- `GET /api/products/barcode/:code`

## Database

SQL migrations live in `migrations/` and model canonical products separately from retailer offers, observations and ingestion audit data.

For a clean local database, `docker compose up` applies the migrations automatically on the first PostgreSQL volume initialization.

## Plaza Lama ingestion

The Plaza Lama adapter is isolated under `src/ingestion/`. It stores normalized product/offer data plus the source payload used for audit/debugging.

To discover the catalog automatically and ingest it:

```bash
cd apps/api
pnpm ingest:plaza-lama
```

The crawler starts from `PLAZA_LAMA_CATEGORY_URLS`, stays on `plazalama.com.do`, follows category links, deduplicates product candidates and applies request limits/delays. The product parser is the final validation step, so non-product links are skipped instead of being persisted as offers.

Useful controls:

```env
PLAZA_LAMA_CATEGORY_URLS=https://plazalama.com.do/oldHome,https://plazalama.com.do/ca/electrodomesticos/4
PLAZA_LAMA_MAX_CATEGORY_PAGES=150
PLAZA_LAMA_MAX_PRODUCTS=5000
PLAZA_LAMA_DISCOVERY_DELAY_MS=500
PLAZA_LAMA_PRODUCT_DELAY_MS=350
```

For a controlled run, set `PLAZA_LAMA_URLS` to a comma-separated list of product URLs; explicit URLs bypass catalog discovery.

## Frontend

Enable the API-backed catalog in the existing Vite frontend with:

```env
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:3001/api
```

With `VITE_USE_API=false`, the Figma fixture experience remains available.
