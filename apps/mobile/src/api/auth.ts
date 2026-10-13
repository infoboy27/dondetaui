import type { MfaMethod, User } from '../types'
import { apiFetch } from './http'

export interface AuthResult {
  token: string
  user: User
}

// Sign-in paused for the second step (accounts with 2FA on).
export interface MfaChallenge {
  mfaRequired: true
  challenge: string
  method: MfaMethod
  emailHint: string | null
}

export type LoginResult = AuthResult | MfaChallenge

export function isMfaChallenge(result: LoginResult): result is MfaChallenge {
  return 'mfaRequired' in result && result.mfaRequired === true
}

function post<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  return apiFetch<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export const authApi = {
  register(email: string, password: string, name?: string, phone?: string): Promise<AuthResult> {
    return post('/auth/register', { email, password, name, phone })
  },

  login(email: string, password: string): Promise<LoginResult> {
    return post('/auth/login', { email, password })
  },

  verifyMfa(challenge: string, code: string, method?: MfaMethod): Promise<AuthResult> {
    return post('/auth/mfa/verify', { challenge, code, method })
  },

  sendMfaEmail(challenge: string): Promise<{ emailHint: string }> {
    return post('/auth/mfa/email-code', { challenge })
  },

  forgotPassword(email: string): Promise<{ ok: true }> {
    return post('/auth/password/forgot', { email })
  },

  resetPassword(email: string, code: string, password: string): Promise<LoginResult> {
    return post('/auth/password/reset', { email, code, password })
  },

  me(): Promise<User> {
    return apiFetch<User>('/auth/me')
  },

  sendVerification(): Promise<{ emailHint: string; alreadyVerified: boolean }> {
    return post('/auth/email/send-code')
  },

  verifyEmail(code: string): Promise<User> {
    return post('/auth/email/verify', { code })
  },

  changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
    return post('/auth/password/change', { currentPassword, newPassword })
  },

  enableEmailMfa(password: string): Promise<User> {
    return post('/auth/mfa/email/enable', { password })
  },

  setupTotp(password: string): Promise<{ secret: string | null; otpauthUrl: string | null; reuseExisting: boolean }> {
    return post('/auth/mfa/totp/setup', { password })
  },

  enableTotp(code: string): Promise<User> {
    return post('/auth/mfa/totp/enable', { code })
  },

  disableMfa(password: string): Promise<User> {
    return post('/auth/mfa/disable', { password })
  },

  logoutEverywhere(): Promise<AuthResult> {
    return post('/auth/logout-all')
  },

  deleteAccount(password: string): Promise<{ deleted: true }> {
    return post('/auth/me', { password }, 'DELETE')
  },
}
