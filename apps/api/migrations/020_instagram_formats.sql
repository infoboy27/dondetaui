-- Instagram autopilot formats beyond the single image: a weekly "Top 5"
-- carousel and Reels (video). instagram_posts.image keeps a cover/preview
-- for the admin history; every file Instagram has to download lives in
-- instagram_post_media, served at /api/ig-media/<post id>-<position>.<ext>.
alter table instagram_posts add column if not exists format text not null default 'image';
alter table instagram_posts drop constraint if exists instagram_posts_format_check;
alter table instagram_posts add constraint instagram_posts_format_check check (format in ('image', 'carousel', 'reel'));

alter table instagram_posts drop constraint if exists instagram_posts_kind_check;
alter table instagram_posts add constraint instagram_posts_kind_check check (kind in ('comparison', 'drop', 'top5'));

create table if not exists instagram_post_media (
  post_id uuid not null references instagram_posts(id) on delete cascade,
  position int not null,
  content_type text not null check (content_type in ('image/jpeg', 'video/mp4')),
  data bytea not null,
  primary key (post_id, position)
);

-- Per-offer history lookups (the /black-friday price check, product pages)
-- were scanning the whole table.
create index if not exists price_observations_offer_observed_idx on price_observations (offer_id, observed_at);
