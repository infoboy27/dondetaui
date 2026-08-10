create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid references retailers(id) on delete set null,
  source text not null,
  status text not null default 'running' check (status in ('running','completed','failed')),
  items_seen integer not null default 0,
  items_ingested integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists retailer_raw_items (
  id bigserial primary key,
  retailer_id uuid not null references retailers(id) on delete cascade,
  ingestion_run_id uuid references ingestion_runs(id) on delete set null,
  external_sku text not null,
  source_url text,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

create index if not exists retailer_raw_items_retailer_sku_idx
  on retailer_raw_items(retailer_id, external_sku, fetched_at desc);

create index if not exists ingestion_runs_retailer_started_idx
  on ingestion_runs(retailer_id, started_at desc);
