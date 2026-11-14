import { describe, expect, it } from 'vitest'
import { buildSignupSource, shouldShowSignupPrompt, signupPromptCopy } from './signupPrompt'

const base = { pathname: '/product/tv-samsung', search: '', signedIn: false, dismissedAt: null, done: false, now: new Date('2026-11-14T12:00:00Z') }

describe('shouldShowSignupPrompt', () => {
  it('shows to signed-out first-time visitors on normal pages', () => {
    expect(shouldShowSignupPrompt(base)).toBe(true)
    expect(shouldShowSignupPrompt({ ...base, pathname: '/' })).toBe(true)
  })

  it('never shows to signed-in visitors or after signing up', () => {
    expect(shouldShowSignupPrompt({ ...base, signedIn: true })).toBe(false)
    expect(shouldShowSignupPrompt({ ...base, done: true })).toBe(false)
  })

  it('skips account, admin, render and auth pages, and links that already sign up', () => {
    for (const pathname of ['/cuenta/black-friday', '/cuenta/seguridad', '/admin', '/admin/instagram', '/ig-render', '/login', '/profile']) {
      expect(shouldShowSignupPrompt({ ...base, pathname })).toBe(false)
    }
    expect(shouldShowSignupPrompt({ ...base, pathname: '/administrar-algo' })).toBe(true)
    expect(shouldShowSignupPrompt({ ...base, search: '?activar=1' })).toBe(false)
  })

  it('stays away for 14 days after a dismissal', () => {
    expect(shouldShowSignupPrompt({ ...base, dismissedAt: '2026-11-01T12:00:00Z' })).toBe(false)
    expect(shouldShowSignupPrompt({ ...base, dismissedAt: '2026-10-30T11:00:00Z' })).toBe(true)
    expect(shouldShowSignupPrompt({ ...base, dismissedAt: 'garbage' })).toBe(true)
  })
})

describe('signupPromptCopy', () => {
  it('pitches the Black Friday digest through Cyber Monday', () => {
    const bf = signupPromptCopy(new Date('2026-11-14T12:00:00Z'))
    expect(bf.kind).toBe('black-friday')
    expect(bf.href).toBe('/cuenta/black-friday?activar=1&utm_source=web&utm_medium=popup&utm_campaign=black-friday-2026')
    expect(signupPromptCopy(new Date('2026-11-30T20:00:00Z')).kind).toBe('black-friday')
  })

  it('pitches price alerts the rest of the year', () => {
    const generic = signupPromptCopy(new Date('2026-12-02T12:00:00Z'))
    expect(generic.kind).toBe('alerts')
    expect(generic.href).toContain('/login?registro=1')
    expect(generic.href).toContain('utm_medium=popup')
    expect(signupPromptCopy(new Date('2026-06-01T12:00:00Z')).kind).toBe('alerts')
  })

  it('uses the generic pitch where the Black Friday digest is not sent', () => {
    expect(signupPromptCopy(new Date('2026-11-14T12:00:00Z'), false).kind).toBe('alerts')
  })
})

describe('buildSignupSource', () => {
  it('keeps utm params, the landing path and an external referrer', () => {
    const source = buildSignupSource(
      'https://dondeta.com.do/black-friday?utm_source=instagram&utm_medium=paid&utm_campaign=black-friday-2026&x=1',
      'https://l.instagram.com/',
    )
    expect(Object.fromEntries(new URLSearchParams(source))).toEqual({
      utm_source: 'instagram', utm_medium: 'paid', utm_campaign: 'black-friday-2026', landing: '/black-friday', ref: 'l.instagram.com',
    })
  })

  it('drops same-site and missing referrers', () => {
    expect(buildSignupSource('https://dondeta.com.do/', 'https://dondeta.com.do/x')).toBe('landing=%2F')
    expect(buildSignupSource('https://dondeta.com.do/precios', '')).toBe('landing=%2Fprecios')
    expect(buildSignupSource('not a url', '')).toBe('')
  })
})
