import { describe, expect, it } from 'vitest'
import { backInStockPush, cardDiscountPhrase, cardDiscountPush, dealRealPush, lowestPrice90dPush, savedSearchPush, shortName, weeklyDigestPush } from './notification-messages'
import { buildPriceDropPush } from './push-messages'

describe('watch notification push copy', () => {
  it('back in stock names the store when known', () => {
    expect(backInStockPush({ productName: 'Nevera LG', price: 'RD$30,000', store: 'Jumbo', slug: 'nevera-lg' })).toEqual({
      title: 'Volvió a estar disponible',
      body: 'Nevera LG ya está disponible en Jumbo: RD$30,000.',
      data: { type: 'back_in_stock', url: '/product/nevera-lg' },
    })
    expect(backInStockPush({ productName: 'Nevera LG', price: 'RD$30,000', store: null, slug: null }).body).toBe('Nevera LG ya está disponible: RD$30,000.')
    expect(backInStockPush({ productName: 'Nevera LG', price: 'RD$30,000', store: null, slug: null }).data).toEqual({ type: 'back_in_stock' })
  })

  it('90-day low', () => {
    const push = lowestPrice90dPush({ productName: 'TV', price: 'RD$9,000', slug: 'tv' })
    expect(push.title).toBe('Precio más bajo en 90 días')
    expect(push.body).toContain('RD$9,000')
  })

  it('a merged price drop says it is the 90-day low', () => {
    expect(buildPriceDropPush({ productName: 'TV', newPrice: 'RD$9,000', pct: 10, slug: null, lowest90d: true }).title).toBe('Precio más bajo en 90 días (−10 %)')
    expect(buildPriceDropPush({ productName: 'TV', newPrice: 'RD$9,000', pct: 10, slug: null }).title).toBe('Bajó de precio (−10 %)')
  })

  it('card discounts: discount vs cashback, card name and days', () => {
    const base = { store: 'Jumbo', bank: 'BHD', card: null, percent: 10, kind: 'discount' as const, days: '' }
    expect(cardDiscountPhrase(base)).toBe('10 % con tarjetas BHD')
    expect(cardDiscountPhrase({ ...base, card: 'Visa', days: ' los martes' })).toBe('10 % con tarjetas BHD Visa los martes')
    expect(cardDiscountPhrase({ ...base, kind: 'cashback', percent: 7.5 })).toBe('7.5 % de reembolso con tarjetas BHD')
    expect(cardDiscountPush(base, { productName: 'Lavadora', slug: 'lav' }, 0).body).toBe('10 % con tarjetas BHD. Aplica a Lavadora de tus guardados.')
    expect(cardDiscountPush(base, { productName: 'Lavadora', slug: 'lav' }, 2).body).toContain('Lavadora y 2 productos más')
    expect(cardDiscountPush(base, { productName: 'Lavadora', slug: 'lav' }, 1).body).toContain('Lavadora y 1 producto más')
  })

  it('saved search: one product opens it, several open the search tab', () => {
    const one = savedSearchPush({ query: 'nevera', productName: 'Nevera X', price: 'RD$20,000', slug: 'nevera-x', count: 1 })
    expect(one.title).toBe('Novedades en tu búsqueda “nevera”')
    expect(one.data).toEqual({ type: 'saved_search', url: '/product/nevera-x' })
    const many = savedSearchPush({ query: 'nevera', productName: 'Nevera X', price: 'RD$20,000', slug: 'nevera-x', count: 3 })
    expect(many.body).toContain('3 productos')
    expect(many.data).toEqual({ type: 'saved_search', url: '/search' })
  })

  it('weekly digest opens the saved products', () => {
    expect(weeklyDigestPush('2 bajaron de precio')).toEqual({
      title: 'Tu resumen de la semana',
      body: 'De lo que guardaste, 2 bajaron de precio.',
      data: { type: 'weekly_digest', url: '/alerts' },
    })
  })

  it('real seasonal offer, single and several', () => {
    const single = dealRealPush({ seasonName: 'Black Friday', productName: 'TV', price: 'RD$9,000', pct: 12, slug: 'tv', more: 0 })
    expect(single.title).toBe('Oferta real de Black Friday')
    expect(single.body).toBe('TV: RD$9,000, 12 % bajo su promedio de 30 días.')
    expect(dealRealPush({ seasonName: 'Black Friday', productName: 'TV', price: 'RD$9,000', pct: 12, slug: 'tv', more: 2 }).body).toContain('TV y 2 productos más')
  })

  it('shortens long product names', () => {
    expect(shortName('x'.repeat(100))).toHaveLength(80)
    expect(shortName('corto')).toBe('corto')
  })
})
