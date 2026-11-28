import { describe, expect, it } from 'vitest'
import { PROMO_CARD_SNOOZE_DAYS, parsePromoPref, shouldShowPromoCard } from './promoPush'

describe('promo push consent', () => {
  it('parses only known prefs', () => {
    expect(parsePromoPref('on')).toBe('on')
    expect(parsePromoPref('off')).toBe('off')
    expect(parsePromoPref(null)).toBe('unset')
    expect(parsePromoPref('yes')).toBe('unset')
  })

  it('offers the card only before the person chose, on devices with push', () => {
    expect(shouldShowPromoCard({ supported: true, pref: 'unset', dismissedAt: null })).toBe(true)
    expect(shouldShowPromoCard({ supported: false, pref: 'unset', dismissedAt: null })).toBe(false)
    expect(shouldShowPromoCard({ supported: true, pref: 'on', dismissedAt: null })).toBe(false)
    expect(shouldShowPromoCard({ supported: true, pref: 'off', dismissedAt: null })).toBe(false)
  })

  it('stays hidden after "×" until the snooze ends', () => {
    const now = Date.parse('2026-12-01T12:00:00Z')
    const day = 86_400_000
    expect(shouldShowPromoCard({ supported: true, pref: 'unset', dismissedAt: now - day, now })).toBe(false)
    expect(shouldShowPromoCard({ supported: true, pref: 'unset', dismissedAt: now - PROMO_CARD_SNOOZE_DAYS * day, now })).toBe(true)
  })
})
