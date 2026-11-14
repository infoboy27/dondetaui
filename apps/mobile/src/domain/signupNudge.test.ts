import { describe, expect, it } from 'vitest'
import { appSignupSource, nudgeCopy, shouldShowNudge } from './signupNudge'

const DAY = 86_400_000
const now = Date.UTC(2026, 10, 14)

describe('shouldShowNudge', () => {
  it('never shows to signed-in users or people who already signed up here', () => {
    expect(shouldShowNudge({ signedIn: true, dismissedAt: null, hasSignedUp: false }, now)).toBe(false)
    expect(shouldShowNudge({ signedIn: false, dismissedAt: null, hasSignedUp: true }, now)).toBe(false)
  })

  it('shows to guests, then waits 14 days after "Ahora no"', () => {
    expect(shouldShowNudge({ signedIn: false, dismissedAt: null, hasSignedUp: false }, now)).toBe(true)
    expect(shouldShowNudge({ signedIn: false, dismissedAt: now - 13 * DAY, hasSignedUp: false }, now)).toBe(false)
    expect(shouldShowNudge({ signedIn: false, dismissedAt: now - 14 * DAY, hasSignedUp: false }, now)).toBe(true)
  })
})

describe('nudgeCopy', () => {
  it('uses the Black Friday copy in the DR during the campaign', () => {
    expect(nudgeCopy('DO', new Date('2026-11-14T12:00:00Z')).target).toBe('black-friday')
    expect(nudgeCopy('DO', new Date('2026-11-30T12:00:00Z')).target).toBe('black-friday')
  })

  it('falls back to price alerts after Cyber Monday and outside the DR', () => {
    expect(nudgeCopy('DO', new Date('2026-12-05T12:00:00Z')).target).toBe('register')
    expect(nudgeCopy('CO', new Date('2026-11-14T12:00:00Z')).target).toBe('register')
  })
})

describe('appSignupSource', () => {
  it('builds the query string the API whitelists', () => {
    expect(appSignupSource('ios')).toBe('utm_source=app&utm_medium=ios')
    expect(appSignupSource('android', '/cuenta/black-friday')).toBe('utm_source=app&utm_medium=android&landing=%2Fcuenta%2Fblack-friday')
  })
})
