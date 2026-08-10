create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  name text not null,
  brand text not null,
  subtitle text,
  image_url text,
  rating numeric(3,2) not null default 0,
  reviews integer not null default 0,
  discount integer not null default 0,
  previous_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  model text not null,
  ean text,
  upc text,
  manufacturer_sku text,
  attributes jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  unique(product_id, model)
);

create unique index if not exists product_variants_ean_uq on product_variants(ean) where ean is not null;
create unique index if not exists product_variants_upc_uq on product_variants(upc) where upc is not null;

create table if not exists retailers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  abbr text not null,
  primary_color text not null default '#00B894',
  logo_url text,
  website_url text,
  created_at timestamptz not null default now()
);

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references retailers(id) on delete cascade,
  name text not null,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references product_variants(id) on delete cascade,
  retailer_id uuid not null references retailers(id) on delete cascade,
  store_id uuid references stores(id) on delete set null,
  external_sku text,
  url text,
  price numeric(14,2) not null,
  shipping_price numeric(14,2) not null default 0,
  availability text not null default 'unknown' check (availability in ('in_stock','out_of_stock','unknown')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_variant_id, retailer_id, store_id, external_sku)
);

create table if not exists price_observations (
  id bigserial primary key,
  offer_id uuid not null references offers(id) on delete cascade,
  price numeric(14,2) not null,
  shipping_price numeric(14,2) not null default 0,
  availability text not null,
  observed_at timestamptz not null default now()
);

create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index if not exists products_brand_trgm_idx on products using gin (brand gin_trgm_ops);
create index if not exists offers_variant_idx on offers(product_variant_id);
create index if not exists observations_offer_date_idx on price_observations(offer_id, observed_at desc);
