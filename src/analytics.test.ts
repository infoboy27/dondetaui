import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackOfferClick, trackSearch } from './analytics'
import type { Product, StorePrice } from './types'

describe('analytics', () => {
  afterEach(() => { delete window.gtag })

  it('sends click_offer with store, placement and the product as a GA4 item', () => {
    const gtag = vi.fn()
    window.gtag = gtag
    const product = { id: 'p1', name: 'Nevera LG', brand: 'LG', category: 'Neveras' } as Product
    const offer = { store: 'Jumbo', price: 30_000 } as StorePrice
    trackOfferClick(product, offer, 'mobile_detail')
    expect(gtag).toHaveBeenCalledWith('event', 'click_offer', {
      store: 'Jumbo', placement: 'mobile_detail', value: 30_000, currency: 'DOP',
      items: [{ item_id: 'p1', item_name: 'Nevera LG', item_brand: 'LG', item_category: 'Neveras', affiliation: 'Jumbo', price: 30_000 }],
    })
  })

  it('skips empty searches and is a no-op without gtag', () => {
    const gtag = vi.fn()
    window.gtag = gtag
    trackSearch('   ')
    expect(gtag).not.toHaveBeenCalled()
    delete window.gtag
    expect(() => trackSearch('nevera')).not.toThrow()
  })
})
