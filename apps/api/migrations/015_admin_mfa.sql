-- Two-step verification for the admin portal (TOTP: Google Authenticator,
-- Authy...). Secrets are stored encrypted (AES-256-GCM, key derived from
-- JWT_SECRET) -- see src/admin/totp.ts.
alter table users add column if not exists totp_secret_enc text;
alter table users add column if not exists totp_pending_enc text;
alter table users add column if not exists totp_enabled_at timestamptz;
-- "Cerrar todas las sesiones": admin tokens issued before this are rejected.
alter table users add column if not exists admin_sessions_valid_after timestamptz;
