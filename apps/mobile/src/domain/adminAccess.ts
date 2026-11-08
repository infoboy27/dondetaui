// Who sees the owner's metrics panel in the app. Plain module (tested).
// The server decides: GET /admin/me with the shopper's session answers
// 403 "not_admin" to everyone except the email in ADMIN_EMAILS, which gets
// "mfa_required" until the authenticator code is entered. Anything else
// (errors, no connection, unknown answers) keeps the panel hidden.

export type AdminAccess = 'none' | 'locked' | 'setup' | 'open'

export function adminAccessFrom(result: { ok: true } | { ok: false; status: number; message?: string }): AdminAccess {
  if (result.ok) return 'open'
  if (result.status !== 403) return 'none'
  if (result.message === 'mfa_required') return 'locked'
  if (result.message === 'mfa_setup_required') return 'setup'
  return 'none'
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('es-DO')
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return minutes ? `${minutes} min ${rest} s` : `${rest} s`
}
