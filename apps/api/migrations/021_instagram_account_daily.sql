-- Daily Instagram follower count (Instagram only reports new followers per
-- day), written by the autopilot loop and the /admin insights call.
create table if not exists instagram_account_daily (
  day date primary key,
  followers int not null,
  media_count int not null,
  created_at timestamptz not null default now()
);
