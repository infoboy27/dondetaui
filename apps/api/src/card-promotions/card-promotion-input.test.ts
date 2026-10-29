import { describe, expect, it } from 'vitest'
import { dominicanToday, parseCardPromotion } from './card-promotion-input'

const valid = { retailerSlug: 'plaza-lama', bank: 'BHD', percent: '10', startsOn: '2026-10-01', endsOn: '2026-10-31' }

describe('parseCardPromotion', () => {
  it('normalizes a valid promotion', () => {
    const input = parseCardPromotion({ ...valid, weekdays: [4, 2, 2], maxDiscount: '5000' }, '2026-10-29')
    expect(input).toMatchObject({ percent: 10, weekdays: [2, 4], maxDiscount: 5000, minPurchase: 0, card: null })
  })

  it('treats no days or all seven as every day', () => {
    expect(parseCardPromotion({ ...valid, weekdays: [] }, '2026-10-29').weekdays).toBeNull()
    expect(parseCardPromotion({ ...valid, weekdays: [0, 1, 2, 3, 4, 5, 6] }, '2026-10-29').weekdays).toBeNull()
  })

  it('rejects bad input', () => {
    expect(() => parseCardPromotion({ ...valid, percent: '0' }, '2026-10-29')).toThrow()
    expect(() => parseCardPromotion({ ...valid, endsOn: '' }, '2026-10-29')).toThrow('fin')
    expect(() => parseCardPromotion({ ...valid, endsOn: '2026-09-30' }, '2026-10-29')).toThrow()
    expect(() => parseCardPromotion({ ...valid, endsOn: '2026-10-28', startsOn: '2026-10-01' }, '2026-10-29')).toThrow('terminó')
    expect(() => parseCardPromotion({ ...valid, termsUrl: 'http://x.do' }, '2026-10-29')).toThrow('https')
    expect(() => parseCardPromotion({ ...valid, weekdays: [7] }, '2026-10-29')).toThrow()
  })
})

describe('dominicanToday', () => {
  it('rolls over at midnight Santo Domingo time', () => {
    expect(dominicanToday(new Date('2026-10-30T03:59:00Z'))).toBe('2026-10-29')
    expect(dominicanToday(new Date('2026-10-30T04:00:00Z'))).toBe('2026-10-30')
  })
})
