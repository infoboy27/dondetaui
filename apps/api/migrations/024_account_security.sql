-- Account security for shopper accounts: email verification, password reset,
-- optional two-factor sign-in (email code or authenticator app) and "sign out
-- of every device". The authenticator secret reuses the admin TOTP columns
-- from 015 (one authenticator per account, admin portal included).

-- Set when the user proves they own the inbox (a verification or reset code).
alter table users add column if not exists email_verified_at timestamptz;

-- Second step at sign-in, chosen by the user: null (off), 'email' or 'totp'.
alter table users add column if not exists mfa_method text;
do $$ begin
  alter table users add constraint users_mfa_method_check check (mfa_method in ('email', 'totp'));
exception when duplicate_object then null; end $$;

-- Tokens issued before this instant are rejected ("cerrar sesión en todos
-- los dispositivos", password change/reset).
alter table users add column if not exists sessions_valid_after timestamptz;

-- One-time 6-digit codes sent by email. Only a keyed hash is stored; a code
-- expires after 10 minutes or 5 wrong attempts, and issuing a new one for
-- the same purpose voids the previous.
create table if not exists auth_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  purpose text not null check (purpose in ('verify_email', 'reset_password', 'login')),
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists auth_codes_user_purpose_idx on auth_codes (user_id, purpose, created_at desc);
