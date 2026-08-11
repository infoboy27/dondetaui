import { useEffect, useState } from 'react'
import { authApi } from '../api/auth'
import { clearToken, getToken, setToken } from '../auth/session'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const token = await getToken()
      if (!token) {
        if (!cancelled) setState({ user: null, loading: false, error: null })
        return
      }
      try {
        const user = await authApi.me()
        if (!cancelled) setState({ user, loading: false, error: null })
      } catch {
        await clearToken()
        if (!cancelled) setState({ user: null, loading: false, error: null })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string) => {
    setState(current => ({ ...current, loading: true, error: null }))
    try {
      const { token, user } = await authApi.login(email, password)
      await setToken(token)
      setState({ user, loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión'
      setState({ user: null, loading: false, error: message })
      throw error
    }
  }

  const register = async (email: string, password: string, name?: string, phone?: string) => {
    setState(current => ({ ...current, loading: true, error: null }))
    try {
      const { token, user } = await authApi.register(email, password, name, phone)
      await setToken(token)
      setState({ user, loading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta'
      setState({ user: null, loading: false, error: message })
      throw error
    }
  }

  const logout = async () => {
    await clearToken()
    setState({ user: null, loading: false, error: null })
  }

  return { ...state, login, register, logout }
}
