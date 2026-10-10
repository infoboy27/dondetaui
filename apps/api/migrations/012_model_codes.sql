-- Manufacturer model codes extracted from product name + model
-- (src/ingestion/model-codes.ts). Ingestion matches incoming items against
-- these so the same appliance sold by two retailers lands on one product.
-- Backfilled by dist/ingestion/merge-products.cli.js, not here: extraction
-- lives in TypeScript and must not drift into a second SQL copy.
alter table product_variants add column if not exists model_codes text[] not null default '{}';
create index if not exists product_variants_model_codes_idx on product_variants using gin (model_codes);

-- When duplicates are merged, the losing product's slug keeps resolving to
-- the surviving product so already-indexed URLs redirect instead of 404ing.
create table if not exists product_slug_redirects (
  old_slug text primary key,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now()
);
