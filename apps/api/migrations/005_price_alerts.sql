alter table users add column if not exists phone text;

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  target_price numeric(14,2),
  last_notified_price numeric(14,2),
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create index if not exists price_alerts_user_idx on price_alerts(user_id);
create index if not exists price_alerts_product_idx on price_alerts(product_id);
