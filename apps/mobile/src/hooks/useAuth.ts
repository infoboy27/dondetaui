import { useCallback, useEffect, useState } from 'react'
import { authApi, isMfaChallenge, type AuthResult, type LoginResult, type MfaChallenge } from '../api/auth'
import { setSessionExpiredHandler } from '../api/http'
import { clearToken, getToken, setToken } from '../auth/session'
import type { MfaMethod, User } from '../types'

// 'signedIn' when done, 'mfa' when the account asks for a second step
// (`pendingMfa` then holds the challenge for verifyMfa/sendMfaEmail).
export type SignInOutcome = 'signedIn' | 'mfa'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingMfa, setPendingMfa] = useState<MfaChallenge | null>(null)

  const signOutLocally = useCallback(async () => {
    await clearToken()
    setUser(null)
    setPendingMfa(null)
  }, [])

  // Restore the saved session, and sign out whenever the server says the
  // session is no longer valid (closed on another device, account deleted).
  useEffect(() => {
    let cancelled = false
    setSessionExpiredHandler(() => void signOutLocally())

    void (async () => {
      const token = await getToken()
      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch {
        await clearToken()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      setSessionExpiredHandler(null)
    }
  }, [signOutLocally])

  const applySession = async ({ token, user: signedIn }: AuthResult) => {
    await setToken(token)
    setPendingMfa(null)
    setUser(signedIn)
  }

  const handleLoginResult = async (result: LoginResult): Promise<SignInOutcome> => {
    if (isMfaChallenge(result)) {
      setPendingMfa(result)
      return 'mfa'
    }
    await applySession(result)
    return 'signedIn'
  }

  return {
    user,
    loading,
    pendingMfa,
    setUser,

    async login(email: string, password: string): Promise<SignInOutcome> {
      return handleLoginResult(await authApi.login(email.trim(), password))
    },

    async register(email: string, password: string, name?: string): Promise<void> {
      await applySession(await authApi.register(email.trim(), password, name?.trim() || undefined))
    },

    async verifyMfa(code: string, method?: MfaMethod): Promise<void> {
      if (!pendingMfa) throw new Error('El inicio de sesión venció. Vuelve a escribir tu contraseña.')
      await applySession(await authApi.verifyMfa(pendingMfa.challenge, code, method))
    },

    // Emails a sign-in code (resend, or fallback for authenticator users).
    async sendMfaEmail(): Promise<string> {
      if (!pendingMfa) throw new Error('El inicio de sesión venció. Vuelve a escribir tu contraseña.')
      const { emailHint } = await authApi.sendMfaEmail(pendingMfa.challenge)
      return emailHint
    },

    cancelMfa() {
      setPendingMfa(null)
    },

    async resetPassword(email: string, code: string, password: string): Promise<SignInOutcome> {
      return handleLoginResult(await authApi.resetPassword(email.trim(), code, password))
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
      await applySession(await authApi.changePassword(currentPassword, newPassword))
    },

    async logoutEverywhere(): Promise<void> {
      await applySession(await authApi.logoutEverywhere())
    },

    async deleteAccount(password: string): Promise<void> {
      await authApi.deleteAccount(password)
      await signOutLocally()
    },

    async logout(): Promise<void> {
      await signOutLocally()
    },
  }
}

export type AuthApi = ReturnType<typeof useAuth>
