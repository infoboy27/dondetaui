import { useEffect, useState } from 'react'
import { trackAuth } from '../analytics'
import { authApi, isMfaChallenge, type LoginResult } from '../api/auth'
import { appConfig } from '../config/env'
import { clearToken, getToken, setToken, subscribeSession } from '../auth/session'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: appConfig.useApi && Boolean(getToken()),
    error: null,
  })

  useEffect(() => {
    if (!appConfig.useApi || !getToken()) return

    let cancelled = false
    authApi.me()
      .then(user => { if (!cancelled) setState({ user, loading: false, error: null }) })
      .catch(() => {
        clearToken()
        if (!cancelled) setState({ user: null, loading: false, error: null })
      })

    return () => { cancelled = true }
  }, [])

  // Two-step sign-in, password reset and account settings finish outside
  // this hook (AuthForm, AccountSecurity) and announce the result here.
  useEffect(() => subscribeSession(event => {
    setState({ user: event?.user ?? null, loading: false, error: null })
  }), [])

  // Resolves with the API's answer: signed in, or an MFA challenge that the
  // auth form completes (the session then arrives via subscribeSession).
  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (!appConfig.useApi) {
      const message = 'Iniciar sesión requiere conexión con el servidor.'
      setState(current => ({ ...current, error: message }))
      throw new Error(message)
    }

    setState(current => ({ ...current, loading: true, error: null }))
    try {
      const result = await authApi.login(email, password)
      if (isMfaChallenge(result)) {
        setState(current => ({ ...current, loading: false, error: null }))
        return result
      }
      setToken(result.token)
      trackAuth('login')
      setState({ user: result.user, loading: false, error: null })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión'
      setState({ user: null, loading: false, error: message })
      throw error
    }
  }

  const register = async (email: string, password: string, name?: string, phone?: string) => {
    if (!appConfig.useApi) {
      const message = 'Crear cuenta requiere conexión con el servidor.'
      setState(current => ({ ...current, error: message }))
      throw new Error(message)
    }

    setState(current => ({ ...current, loading: true, error: null }))
    try {
      const { token, user } = await authApi.register(email, password, name, phone)
      setToken(token)
      trackAuth('sign_up')
      setState({ user, loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta'
      setState({ user: null, loading: false, error: message })
      throw error
    }
  }

  const logout = () => {
    clearToken()
    setState({ user: null, loading: false, error: null })
  }

  return { ...state, login, register, logout }
}
