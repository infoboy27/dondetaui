# DóndeTa — Development Server Deployment

This repository can run the DóndeTa MVP as a single Docker Compose stack:

- React/Vite web UI served by Nginx
- Nginx reverse proxy for `/api`
- NestJS API
- PostgreSQL
- Redis
- idempotent SQL migration runner
- optional retailer ingestion worker

## Server requirements

- Linux VPS (Ubuntu 24.04+ recommended)
- Docker Engine + Docker Compose plugin
- Git
- at least 4 GB RAM for a small development environment; 8 GB+ recommended when ingestion is enabled
- a DNS name is recommended for Android testing outside the local network

## First deployment

```bash
git clone https://github.com/infoboy27/dondetaui.git
cd dondetaui
cp .env.server.example .env
nano .env
```

Change `POSTGRES_PASSWORD` before starting the stack.

Then:

```bash
docker compose up -d --build
```

Check:

```bash
docker compose ps
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/api/health
```

Open in a browser:

```text
http://SERVER_IP:8080
```

The web image is built with `VITE_USE_API=true` and `VITE_API_BASE_URL=/api`, so the browser uses the API through the same Nginx origin.

## Database migrations

`migrate` is a one-shot service. It records applied SQL files in `schema_migrations` and only applies each migration once. `002_seed_dev.sql` runs only when `LOAD_DEV_SEED=true`.

To inspect migration status:

```bash
docker compose exec postgres psql -U dondeta -d dondeta -c 'select * from schema_migrations order by applied_at;'
```

## Retailer ingestion

The stack does not crawl retailers by default. This is intentional so a normal deployment does not immediately create external traffic.

Start the bounded ingestion worker explicitly:

```bash
docker compose --profile ingestion up -d ingestion-worker
```

Stop it with:

```bash
docker compose --profile ingestion stop ingestion-worker
```

The limits and interval are controlled from `.env`.

## Updating the dev server

```bash
git pull
docker compose up -d --build
```

The migrator will apply only new migrations.

## Domain and HTTPS

For a real shared development environment, place an HTTPS reverse proxy in front of port 8080. Examples: Traefik, Caddy, Nginx Proxy Manager, or your existing ingress.

Route:

```text
https://dev.your-domain.example -> http://127.0.0.1:8080
```

Do not expose PostgreSQL or Redis publicly. The Compose file binds PostgreSQL, Redis and the direct API port to `127.0.0.1` only.

## Android connection

The Android app lives in `apps/mobile`.

Copy its environment file:

```bash
cd apps/mobile
cp .env.example .env
```

For a phone on the same LAN, use a reachable LAN IP, not `127.0.0.1`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3001/api
```

For a remote development server, use HTTPS:

```env
EXPO_PUBLIC_API_URL=https://dev.your-domain.example/api
```

## Android preview APK

Install EAS CLI and authenticate once:

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas build --platform android --profile preview
```

The `preview` profile is configured to produce an installable APK.

## Google Play build

```bash
cd apps/mobile
eas build --platform android --profile production
```

The production profile produces an Android App Bundle (`.aab`) for Google Play.

## MVP smoke checklist

After deployment verify:

1. `/healthz` returns `ok`.
2. `/api/health` reports API and database healthy.
3. Home loads products.
4. Search returns matching products.
5. Product detail displays offers from multiple retailers when data exists.
6. Android app can load the same catalog from the dev URL.
7. Android camera permission is requested and barcode scanning calls `/api/products/barcode/:code`.
8. Ingestion worker is enabled only when desired and ingestion runs appear in PostgreSQL.
