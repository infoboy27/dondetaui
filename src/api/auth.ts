import type { User } from '../types'
import { apiFetch } from './http'

export interface AuthResult {
  token: string
  user: User
}

export const authApi = {
  register(email: string, password: string, name?: string): Promise<AuthResult> {
    return apiFetch<AuthResult>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
  },

  login(email: string, password: string): Promise<AuthResult> {
    return apiFetch<AuthResult>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  },

  me(): Promise<User> {
    return apiFetch<User>('/auth/me')
  },
}
