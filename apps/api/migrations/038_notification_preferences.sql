-- Watch notifications users can turn off one by one (email + push):
-- back_in_stock, lowest_price_90d, card_discount, saved_search (on by
-- default) and weekly_digest, deal_real (promotional, opt-in only).
-- Sent by the alerts worker (src/notifications/watch-notifications.runner.ts).

-- Only the user's explicit choices are stored, as { "<type>": true|false };
-- missing keys fall back to the defaults in src/notifications/notification-prefs.ts.
create table if not exists notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One row per notification sent: the worker never sends a (user, type,
-- event_key) twice. Keys are built in notification-rules.ts (eventKeys).
create table if not exists notification_events (
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  event_key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, type, event_key)
);

create index if not exists notification_events_sent_idx on notification_events(sent_at);

-- Last known availability of each watched product, so back_in_stock fires
-- only on an out_of_stock -> in_stock transition.
create table if not exists product_stock_states (
  product_id uuid primary key references products(id) on delete cascade,
  state text not null check (state in ('in_stock', 'out_of_stock')),
  changed_at timestamptz not null default now()
);

-- Saved searches: notify when a matching product appears or drops under max_price.
create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  query text not null check (char_length(query) between 2 and 100),
  max_price numeric(14,2) check (max_price is null or max_price > 0),
  created_at timestamptz not null default now(),
  unique (user_id, query)
);

create index if not exists saved_searches_user_idx on saved_searches(user_id);
