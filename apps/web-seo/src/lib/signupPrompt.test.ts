import { describe, expect, it } from 'vitest'
import { buildSignupSource, shouldShowSignupPrompt, signupPromptCopy } from './signupPrompt'

// The full matrix lives in src/domain/signupPrompt.test.ts; this checks the
// mirror agrees on the cases that matter.
describe('signupPrompt (web-seo mirror)', () => {
  const base = { pathname: '/black-friday', search: '', signedIn: false, dismissedAt: null, done: false, now: new Date('2026-11-14T12:00:00Z') }

  it('shows on SEO pages to signed-out visitors only', () => {
    expect(shouldShowSignupPrompt(base)).toBe(true)
    expect(shouldShowSignupPrompt({ ...base, signedIn: true })).toBe(false)
    expect(shouldShowSignupPrompt({ ...base, pathname: '/cuenta/black-friday' })).toBe(false)
    expect(shouldShowSignupPrompt({ ...base, dismissedAt: '2026-11-10T00:00:00Z' })).toBe(false)
  })

  it('picks the Black Friday copy on the Dominican stack only', () => {
    expect(signupPromptCopy(new Date('2026-11-14T12:00:00Z')).kind).toBe('black-friday')
    expect(signupPromptCopy(new Date('2026-11-14T12:00:00Z'), false).kind).toBe('alerts')
    expect(signupPromptCopy(new Date('2026-12-05T12:00:00Z')).kind).toBe('alerts')
  })

  it('builds the same attribution string', () => {
    expect(buildSignupSource('https://dondeta.com.do/precios?utm_source=google', 'https://www.google.com/'))
      .toBe('utm_source=google&landing=%2Fprecios&ref=www.google.com')
  })
})
