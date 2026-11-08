import { describe, expect, it } from 'vitest'
import { adminAccessFrom, formatCount, formatDuration } from './adminAccess'

describe('adminAccessFrom', () => {
  it('hides the panel from regular users', () => {
    expect(adminAccessFrom({ ok: false, status: 403, message: 'not_admin' })).toBe('none')
  })

  it('shows it, locked, to the owner before the authenticator code', () => {
    expect(adminAccessFrom({ ok: false, status: 403, message: 'mfa_required' })).toBe('locked')
    expect(adminAccessFrom({ ok: false, status: 403, message: 'mfa_setup_required' })).toBe('setup')
  })

  it('opens it with a valid admin token', () => {
    expect(adminAccessFrom({ ok: true })).toBe('open')
  })

  it('fails closed on anything unexpected', () => {
    expect(adminAccessFrom({ ok: false, status: 401 })).toBe('none')
    expect(adminAccessFrom({ ok: false, status: 500, message: 'mfa_required' })).toBe('none')
    expect(adminAccessFrom({ ok: false, status: 403 })).toBe('none')
    expect(adminAccessFrom({ ok: false, status: 0 })).toBe('none')
  })
})

describe('formatters', () => {
  it('formats counts and durations', () => {
    expect(formatCount(878)).toBe('878')
    expect(formatDuration(125)).toBe('2 min 5 s')
    expect(formatDuration(42.4)).toBe('42 s')
  })
})
