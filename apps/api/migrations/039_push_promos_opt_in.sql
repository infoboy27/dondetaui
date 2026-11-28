-- Promotional pushes ("Ofertas y recordatorios") need an explicit opt-in in
-- the app (App Store Guideline 4.5.4) and must be easy to turn off. Consent is
-- per device, and a device can opt in without an account, so user_id becomes
-- optional: price-drop pushes still go only to tokens with a user.
alter table push_tokens alter column user_id drop not null;
alter table push_tokens add column if not exists promos_opt_in boolean not null default false;
alter table push_tokens add column if not exists promos_opt_in_at timestamptz;

create index if not exists push_tokens_promos_idx on push_tokens(promos_opt_in) where promos_opt_in and disabled_at is null;
