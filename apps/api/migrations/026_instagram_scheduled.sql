-- Instagram posts queued for a future date (campaigns). The autopilot loop
-- (instagram-autopilot.cli.ts) publishes each one when its time comes,
-- whether or not the daily autopilot is switched on.
create table if not exists instagram_scheduled (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  target text not null check (target in ('feed', 'story')),
  caption text not null,
  image bytea not null,
  publish_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'published', 'failed', 'missed', 'cancelled')),
  attempts int not null default 0,
  error text,
  post_id uuid references instagram_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists instagram_scheduled_due_idx on instagram_scheduled (publish_at) where status = 'scheduled';
