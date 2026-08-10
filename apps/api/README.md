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

The initial schema lives in `migrations/001_initial.sql` and models canonical products separately from retailer offers and price observations.

For a clean local database, `docker compose up` applies that migration automatically on the first PostgreSQL volume initialization.

## Frontend

Point the existing Vite frontend to this API with:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

The frontend product client already uses the endpoint contract above.
