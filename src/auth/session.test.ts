import { beforeEach, describe, expect, it } from 'vitest'
import { clearToken, getToken, setToken } from './session'

describe('session token storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no token has been stored', () => {
    expect(getToken()).toBeNull()
  })

  it('returns the token that was stored', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
  })

  it('overwrites a previously stored token', () => {
    setToken('first')
    setToken('second')
    expect(getToken()).toBe('second')
  })

  it('removes the token after clearToken', () => {
    setToken('abc123')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
