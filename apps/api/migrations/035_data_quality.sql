-- Automatic data-quality pass (apps/api/src/ingestion/data-quality.cli.ts),
-- run after every ingestion cycle.

-- Image health: when each product image was last checked and how many
-- checks in a row failed. Two definitive failures (403/404/410, or not an
-- image) clear image_url so the next ingestion run fills a working one.
alter table products add column if not exists image_checked_at timestamptz;
alter table products add column if not exists image_failures integer not null default 0;

-- Problems the pass can't fix on its own (e.g. one product whose stores'
-- prices differ wildly: probably two different items matched together).
-- One row per product + kind; Discord hears about each one once.
create table if not exists data_quality_flags (
  product_id uuid not null references products(id) on delete cascade,
  kind text not null,
  detail text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (product_id, kind)
);

-- Cecomsa's KeyCDN zone refuses images to other sites (403); its own domain
-- serves the same path. The adapter now stores that URL; fix existing rows.
update products
set image_url = regexp_replace(image_url, '^https?://odoo-[a-z0-9-]+\.kxcdn\.com/', 'https://www.cecomsa.com/')
where image_url ~ '^https?://odoo-[a-z0-9-]+\.kxcdn\.com/';
