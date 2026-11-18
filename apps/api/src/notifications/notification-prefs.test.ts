import { describe, expect, it } from 'vitest'
import { NOTIFICATION_TYPES, defaultPrefs, isNotificationType, isPromotional, parsePrefsPatch, resolvePrefs, wants } from './notification-prefs'

describe('notification prefs defaults', () => {
  it('turns on what the user follows and leaves promotions off (opt-in)', () => {
    expect(defaultPrefs()).toEqual({
      back_in_stock: true,
      lowest_price_90d: true,
      card_discount: true,
      saved_search: true,
      weekly_digest: false,
      deal_real: false,
    })
  })

  it('marks only the weekly digest and seasonal offers as promotional', () => {
    expect(NOTIFICATION_TYPES.filter(isPromotional)).toEqual(['weekly_digest', 'deal_real'])
  })

  it('recognizes only known types', () => {
    expect(isNotificationType('back_in_stock')).toBe(true)
    expect(isNotificationType('price_drop')).toBe(false)
    expect(isNotificationType(3)).toBe(false)
  })
})

describe('resolvePrefs', () => {
  it('falls back to the defaults without stored choices', () => {
    expect(resolvePrefs(null)).toEqual(defaultPrefs())
    expect(resolvePrefs('nope')).toEqual(defaultPrefs())
    expect(resolvePrefs([true])).toEqual(defaultPrefs())
  })

  it('applies stored booleans and ignores unknown keys or other values', () => {
    const prefs = resolvePrefs({ back_in_stock: false, deal_real: true, weekly_digest: 'yes', bogus: true })
    expect(prefs.back_in_stock).toBe(false)
    expect(prefs.deal_real).toBe(true)
    expect(prefs.weekly_digest).toBe(false)
    expect('bogus' in prefs).toBe(false)
  })

  it('wants() answers for one type', () => {
    expect(wants(null, 'card_discount')).toBe(true)
    expect(wants({ card_discount: false }, 'card_discount')).toBe(false)
    expect(wants(null, 'deal_real')).toBe(false)
    expect(wants({ deal_real: true }, 'deal_real')).toBe(true)
  })
})

describe('parsePrefsPatch', () => {
  it('accepts a partial set of known booleans', () => {
    expect(parsePrefsPatch({ prefs: { deal_real: true, back_in_stock: false } })).toEqual({ ok: true, patch: { deal_real: true, back_in_stock: false } })
  })

  it('rejects a missing or empty prefs object', () => {
    expect(parsePrefsPatch(null).ok).toBe(false)
    expect(parsePrefsPatch({}).ok).toBe(false)
    expect(parsePrefsPatch({ prefs: [] }).ok).toBe(false)
    expect(parsePrefsPatch({ prefs: {} }).ok).toBe(false)
  })

  it('rejects unknown types and non-boolean values', () => {
    expect(parsePrefsPatch({ prefs: { spam: true } })).toEqual({ ok: false, error: 'Ese tipo de aviso no existe.' })
    expect(parsePrefsPatch({ prefs: { deal_real: 'true' } }).ok).toBe(false)
  })
})
