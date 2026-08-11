alter table products add column if not exists slug text;

-- Naive backfill for rows ingested before slugs existed. New rows get a
-- properly slugified value from ingestion.repository.ts's slugify() helper;
-- this is just good enough to make old rows unique and URL-safe.
update products
set slug = regexp_replace(lower(coalesce(brand, '') || ' ' || name), '[^a-z0-9]+', '-', 'g') || '-' || left(id::text, 8)
where slug is null;

alter table products alter column slug set not null;
create unique index if not exists products_slug_idx on products(slug);
