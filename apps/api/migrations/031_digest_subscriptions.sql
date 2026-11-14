-- Opt-in email digests ("las ofertas reales de Black Friday"). One row per
-- user and topic; the sender (src/digests/send-deal-digest.cli.ts) records
-- last_sent_on so nobody gets more than one digest a day. The token backs the
-- one-click unsubscribe link in every email (no login needed); the API
-- generates it (crypto.randomBytes), so no extension is required here.
create table if not exists digest_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null check (topic in ('black-friday')),
  unsubscribe_token text not null unique,
  last_sent_on date,
  created_at timestamptz not null default now(),
  unique (user_id, topic)
);
