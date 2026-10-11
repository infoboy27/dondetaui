-- Posts published to Instagram from the admin portal. The JPEG lives here
-- (served publicly at /api/ig-media/<id>.jpg, which is what Instagram's API
-- fetches) so nothing depends on local disk inside the container.
create table if not exists instagram_posts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  kind text not null check (kind in ('comparison', 'drop')),
  caption text not null,
  image bytea not null,
  status text not null default 'pending' check (status in ('pending', 'published', 'failed')),
  ig_media_id text,
  permalink text,
  error text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists instagram_posts_created_idx on instagram_posts (created_at desc);

-- Small key/value store for runtime state the app manages itself (the
-- Instagram token refreshes every ~30 days and must survive restarts).
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
