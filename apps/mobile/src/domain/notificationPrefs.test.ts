import { describe, expect, it } from 'vitest'
import { ALERT_TYPES, NOTIFICATION_TYPES, PROMOTIONAL_TYPES, defaultPrefs, isPromotional, resolvePrefs, withPref } from './notificationPrefs'

describe('notification prefs (mobile)', () => {
  it('lists every type once, split into alerts and promotions', () => {
    const listed = [...ALERT_TYPES, ...PROMOTIONAL_TYPES].map(info => info.type)
    expect([...listed].sort()).toEqual([...NOTIFICATION_TYPES].sort())
    expect(PROMOTIONAL_TYPES.map(info => info.type)).toEqual(['weekly_digest', 'deal_real'])
  })

  it('defaults alerts on and promotions off (opt-in)', () => {
    const prefs = defaultPrefs()
    for (const info of ALERT_TYPES) expect(prefs[info.type]).toBe(true)
    for (const info of PROMOTIONAL_TYPES) expect(prefs[info.type]).toBe(false)
    expect(isPromotional('deal_real')).toBe(true)
    expect(isPromotional('back_in_stock')).toBe(false)
  })

  it('resolves the API answer over the defaults', () => {
    expect(resolvePrefs(undefined)).toEqual(defaultPrefs())
    expect(resolvePrefs([1])).toEqual(defaultPrefs())
    const prefs = resolvePrefs({ back_in_stock: false, deal_real: true, weekly_digest: 'on', other: true })
    expect(prefs.back_in_stock).toBe(false)
    expect(prefs.deal_real).toBe(true)
    expect(prefs.weekly_digest).toBe(false)
  })

  it('flips one switch without touching the others', () => {
    const before = defaultPrefs()
    const after = withPref(before, 'weekly_digest', true)
    expect(after.weekly_digest).toBe(true)
    expect(before.weekly_digest).toBe(false)
    expect(after.back_in_stock).toBe(true)
  })

  it('has Spanish copy for every switch', () => {
    for (const info of [...ALERT_TYPES, ...PROMOTIONAL_TYPES]) {
      expect(info.title.length).toBeGreaterThan(3)
      expect(info.description.endsWith('.')).toBe(true)
    }
  })
})
