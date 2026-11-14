import { describe, expect, it } from 'vitest'
import { classifyImageResponse, offersToDetach, priceSpread, qualityReportMessage, type QualitySummary } from './data-quality'

const offer = (id: string, externalSku: string, price: number, day: number) => ({ id, externalSku, price, createdAt: new Date(2026, 9, day) })

describe('offersToDetach', () => {
  it('splits a store\'s different products stuck on one variant, keeping the listing that created it', () => {
    // Cecomsa's KTC TVs (32", 43", 86") all matched on "AND11".
    const offers = [offer('a', 'TV565', 11001.67, 22), offer('b', 'TV534', 19276.6, 22), offer('c', 'TV564', 157382.96, 22)]
    expect(offersToDetach(offers, 'TV564').map(o => o.id)).toEqual(['a', 'b'])
  })

  it('keeps the oldest listing when the creator is gone', () => {
    const offers = [offer('new', 'X2', 30000, 20), offer('old', 'X1', 10000, 5)]
    expect(offersToDetach(offers, null).map(o => o.id)).toEqual(['new'])
  })

  it('leaves near-equal prices alone: the same item listed twice', () => {
    expect(offersToDetach([offer('a', 'J1', 2995, 1), offer('b', 'J2', 2995, 2)], 'J1')).toEqual([])
    expect(offersToDetach([offer('a', 'J1', 3795, 1), offer('b', 'J2', 3995, 2)], 'J1')).toEqual([])
    expect(offersToDetach([offer('a', 'J1', 3795, 1)], 'J1')).toEqual([])
  })
})

describe('priceSpread', () => {
  it('is max over min, ignoring missing prices', () => {
    expect(priceSpread([100, 250, 0, Number.NaN])).toBe(2.5)
    expect(priceSpread([100])).toBe(1)
  })
})

describe('classifyImageResponse', () => {
  it('treats hotlink blocks, missing files and non-images as broken', () => {
    expect(classifyImageResponse(403, 'text/html')).toBe('broken')
    expect(classifyImageResponse(404, 'text/plain')).toBe('broken')
    expect(classifyImageResponse(200, 'text/html; charset=utf-8')).toBe('broken')
  })

  it('accepts images and doesn\'t judge timeouts, rate limits or server errors', () => {
    expect(classifyImageResponse(200, 'image/webp')).toBe('ok')
    expect(classifyImageResponse(null, null)).toBe('unknown')
    expect(classifyImageResponse(429, 'text/html')).toBe('unknown')
    expect(classifyImageResponse(503, 'text/html')).toBe('unknown')
  })
})

describe('qualityReportMessage', () => {
  const empty: QualitySummary = { site: 'dondeta.com.do', detachedOffers: [], clearedImages: [], imagesChecked: 500, newOutliers: [], openOutliers: 0 }
  const price = (n: number) => `RD$${Math.round(n).toLocaleString('en-US')}`

  it('stays quiet when nothing was fixed or newly found', () => {
    expect(qualityReportMessage(empty, price)).toBeNull()
    expect(qualityReportMessage({ ...empty, openOutliers: 3 }, price)).toBeNull()
  })

  it('summarizes fixes and new outliers', () => {
    const message = qualityReportMessage({
      ...empty,
      detachedOffers: [{ product: 'TELEVISOR KTC 86"', retailer: 'Cecomsa', prices: [11001.67, 157382.96] }],
      clearedImages: [{ product: 'Extractor Drija', host: 'img.plazalama.com.do' }],
      newOutliers: [{ product: 'Lavadora X', slug: 'lavadora-x', detail: 'Jumbo RD$10,000 / Sirena RD$40,000' }],
      openOutliers: 4,
    }, price)!
    expect(message).toContain('Separé 1 ofertas')
    expect(message).toContain('Cecomsa: TELEVISOR KTC 86" (RD$11,002 / RD$157,383)')
    expect(message).toContain('Quité 1 imágenes rotas (de 500 revisadas)')
    expect(message).toContain('/product/lavadora-x')
    expect(message).toContain('Siguen abiertos 4 casos')
  })
})
