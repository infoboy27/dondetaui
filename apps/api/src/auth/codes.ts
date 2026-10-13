import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

// One-time 6-digit codes sent by email (verify email, reset password, sign-in
// second step). Pure helpers -- no Nest, no database -- so they're unit-tested
// in the root vitest suite.

export type CodePurpose = 'verify_email' | 'reset_password' | 'login'

export const CODE_TTL_MS = 10 * 60 * 1000
export const CODE_MAX_ATTEMPTS = 5
// A new code for the same purpose can't be requested sooner than this.
export const CODE_RESEND_COOLDOWN_MS = 60 * 1000

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

// Keyed hash bound to the user and purpose: a leaked table row can't be
// reversed (only 10^6 codes) without the server secret, and a code for one
// purpose never validates another.
export function hashCode(code: string, userId: string, purpose: CodePurpose, secret: string): string {
  return createHmac('sha256', secret).update(`${purpose}:${userId}:${code}`).digest('hex')
}

export function codeMatches(code: string, storedHash: string, userId: string, purpose: CodePurpose, secret: string): boolean {
  const clean = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(clean)) return false
  const candidate = Buffer.from(hashCode(clean, userId, purpose, secret), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  return candidate.length === stored.length && timingSafeEqual(candidate, stored)
}

// "j•••@gmail.com" -- tells the user which inbox to check without exposing it.
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 1)}•••@${domain}`
}
