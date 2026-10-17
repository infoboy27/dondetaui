-- Saving a product now opts the user into price-drop alerts for it.
-- auto_created marks alerts made that way, so un-saving removes only those and
-- never an alert the user set explicitly (bell / target price).
alter table price_alerts add column if not exists auto_created boolean not null default false;

insert into price_alerts (user_id, product_id, target_price, auto_created)
select f.user_id, f.product_id, null, true
from favorites f
on conflict (user_id, product_id) do nothing;
