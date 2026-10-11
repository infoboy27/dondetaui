-- Instagram posts can now go to the feed or to Stories (9:16, no caption).
alter table instagram_posts add column if not exists target text not null default 'feed';
alter table instagram_posts drop constraint if exists instagram_posts_target_check;
alter table instagram_posts add constraint instagram_posts_target_check check (target in ('feed', 'story'));
