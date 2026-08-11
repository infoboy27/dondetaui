create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create index if not exists favorites_user_idx on favorites(user_id);
create index if not exists favorites_product_idx on favorites(product_id);
