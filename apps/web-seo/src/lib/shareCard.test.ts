import { describe, expect, it } from 'vitest'
import { cardVerdict, recentHistory, sparklinePath, titleSize } from './shareCard'
import type { PriceCheck } from './types'

const NOW = new Date('2026-11-15T12:00:00Z')

describe('recentHistory', () => {
  it('keeps the last 30 days, one point per day, oldest first', () => {
    const points = recentHistory(
      [
        { date: '2026-09-01', price: 900 },
        { date: '2026-11-14T10:00:00Z', price: 1_000 },
        { date: '2026-10-20', price: 1_100 },
        { date: '2026-11-14T22:00:00Z', price: 1_050 },
        { date: '2026-11-01', price: 0 },
      ],
      NOW,
    )
    expect(points).toEqual([
      { date: '2026-10-20', price: 1_100 },
      { date: '2026-11-14', price: 1_050 },
    ])
  })

  it('handles a missing history', () => {
    expect(recentHistory(undefined, NOW)).toEqual([])
  })
})

describe('sparklinePath', () => {
  it('needs two points', () => {
    expect(sparklinePath([{ date: '2026-11-01', price: 10 }], 100, 50)).toBeNull()
  })

  it('maps the cheapest point to the bottom and the dearest to the top', () => {
    const path = sparklinePath(
      [
        { date: '2026-11-01', price: 200 },
        { date: '2026-11-11', price: 100 },
      ],
      100,
      50,
      0,
    )
    expect(path).toBe('M0.0 0.0 L100.0 50.0')
  })

  it('places points by date and draws a flat price through the middle', () => {
    const path = sparklinePath(
      [
        { date: '2026-11-01', price: 100 },
        { date: '2026-11-02', price: 100 },
        { date: '2026-11-05', price: 100 },
      ],
      100,
      40,
      0,
    )
    expect(path).toBe('M0.0 20.0 L25.0 20.0 L100.0 20.0')
  })
})

function check(verdict: PriceCheck['verdict'], store: string, extra: Partial<PriceCheck> = {}): PriceCheck {
  return {
    productId: 'p', productName: 'Nevera', productSlug: 'nevera', image: '', store, current: 900, verdict,
    reference: 1_000, referenceDate: '2026-11-01', peak: 1_200, peakDate: '2026-11-05',
    pctVsReference: -10, pctBelowPeak: 25, days: 20, ...extra,
  }
}

describe('cardVerdict', () => {
  it('uses the verdict of the store the card shows', () => {
    const checks = [check('raised', 'Jumbo', { pctVsReference: 12.5 }), check('lowest', 'Sirena')]
    expect(cardVerdict(checks, 'Sirena')).toEqual({ label: 'Oferta real', detail: '10% bajo su mínimo de 30 días', tone: 'good' })
    expect(cardVerdict(checks, 'Jumbo')).toEqual({ label: 'Subió de precio', detail: '+13% sobre su mínimo de 30 días', tone: 'bad' })
  })

  it('labels an inflated discount', () => {
    expect(cardVerdict([check('inflated', 'Corripio', { pctBelowPeak: 33.3 })], 'Corripio')).toEqual({
      label: 'Rebaja inflada',
      detail: '“Bajó” 33%, pero ya costaba eso hace unas semanas',
      tone: 'warn',
    })
  })

  it('says nothing when that store has no verdict', () => {
    expect(cardVerdict([check('lowest', 'Sirena')], 'Jumbo')).toBeNull()
    expect(cardVerdict([check('lowest', 'Sirena')], undefined)).toBeNull()
    expect(cardVerdict([], 'Sirena')).toBeNull()
  })
})

describe('titleSize', () => {
  it('shrinks with longer names', () => {
    expect(titleSize('Nevera LG')).toBeGreaterThan(titleSize('x'.repeat(60)))
    expect(titleSize('x'.repeat(60))).toBeGreaterThan(titleSize('x'.repeat(100)))
  })
})
