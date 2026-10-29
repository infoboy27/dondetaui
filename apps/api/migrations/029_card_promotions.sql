-- Bank card discounts each store runs ("10% con tarjetas BHD los martes").
-- Loaded by hand from the admin portal. ends_on is mandatory: the API hides a
-- promotion the day after it ends and a periodic job deletes it.
create table if not exists card_promotions (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references retailers(id) on delete cascade,
  bank text not null,
  card text,
  percent numeric(5,2) not null check (percent > 0 and percent <= 90),
  max_discount numeric(14,2) check (max_discount is null or max_discount > 0),
  min_purchase numeric(14,2) not null default 0 check (min_purchase >= 0),
  -- Days of the week it applies (0 = Sunday); null means every day.
  weekdays smallint[] check (weekdays is null or weekdays <@ array[0,1,2,3,4,5,6]::smallint[]),
  starts_on date not null,
  ends_on date not null,
  terms_url text,
  note text,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists card_promotions_ends_idx on card_promotions(ends_on);
