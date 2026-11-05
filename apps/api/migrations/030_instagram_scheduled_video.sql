-- A scheduled post can be a Reel: when `video` is set the autopilot loop
-- publishes it as a Reel (feed) and `image` is its cover.
alter table instagram_scheduled add column if not exists video bytea;
