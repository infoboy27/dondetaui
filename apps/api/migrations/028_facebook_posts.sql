-- Log of what the Instagram publisher cross-posts to the country's Facebook Page
-- (apps/api/src/admin/facebook.service.ts). One row per attempt, so a failure
-- (expired token, Meta rejecting a file) is visible without touching the IG post.
create table if not exists facebook_posts (
  id uuid primary key default gen_random_uuid(),
  instagram_post_id uuid references instagram_posts(id) on delete set null,
  format text not null,
  caption text not null,
  status text not null default 'failed' check (status in ('published', 'failed')),
  fb_id text,
  permalink text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists facebook_posts_created_idx on facebook_posts(created_at desc);
