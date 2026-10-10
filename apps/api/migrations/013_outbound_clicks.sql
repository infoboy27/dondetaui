-- Every "Ver en {tienda}" click goes through /api/go, which records it here
-- and redirects to the retailer. This is the traffic number DóndeTa sells:
-- to affiliate programs, to ad reviewers, and to retailers directly.
create table if not exists outbound_clicks (
  id bigserial primary key,
  product_id uuid references products(id) on delete set null,
  retailer_id uuid references retailers(id) on delete set null,
  source text not null default 'web',
  is_bot boolean not null default false,
  referer text,
  user_agent text,
  clicked_at timestamptz not null default now()
);
create index if not exists outbound_clicks_clicked_idx on outbound_clicks(clicked_at desc);
create index if not exists outbound_clicks_retailer_idx on outbound_clicks(retailer_id, clicked_at desc);
