-- Scheduled Instagram posts (instagram-autopilot.cli.ts) are told apart from
-- the ones published by hand from /admin/instagram.
alter table instagram_posts add column if not exists source text not null default 'manual';
alter table instagram_posts drop constraint if exists instagram_posts_source_check;
alter table instagram_posts add constraint instagram_posts_source_check check (source in ('manual', 'autopilot'));
