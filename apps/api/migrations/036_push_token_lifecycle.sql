-- Price-drop push notifications for the mobile app.
-- push_tokens already exists since 011; this makes the full schema explicit
-- (safe on any stack) and adds the lifecycle columns the sender needs:
--   last_seen_at: refreshed every time the app registers the token again;
--   disabled_at:  set when Expo reports the device as no longer registered
--                 (uninstalled app, revoked permission). Disabled tokens are
--                 skipped; a new registration of the same token re-enables it.
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'android',
  created_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on push_tokens(user_id);

alter table push_tokens add column if not exists last_seen_at timestamptz not null default now();
alter table push_tokens add column if not exists disabled_at timestamptz;

-- Expo push tickets waiting for their receipt (available ~15 min after the
-- send). The alerts worker checks them on its next run and disables tokens
-- whose receipt says DeviceNotRegistered, then deletes the row.
create table if not exists push_tickets (
  id text primary key,
  token text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_tickets_created_idx on push_tickets(created_at);
