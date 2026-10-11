import { Pool } from 'pg'

// Lost phone: clears an admin's 2FA so the portal asks to scan a new QR on
// the next sign-in, and revokes every admin session. Run on the server:
//   docker compose exec api node dist/admin/reset-mfa.cli.js <email>
const email = process.argv[2]
if (!email) {
  console.error('usage: node dist/admin/reset-mfa.cli.js <email>')
  process.exit(1)
}
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const pool = new Pool({ connectionString: databaseUrl, max: 1 })
pool
  .query(
    `update users set totp_secret_enc = null, totp_pending_enc = null, totp_enabled_at = null,
       admin_sessions_valid_after = date_trunc('second', now())
     where lower(email) = lower($1)`,
    [email],
  )
  .then(result => console.log(result.rowCount ? `2FA reset for ${email}` : `No user ${email}`))
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
