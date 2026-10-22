import { describe, expect, it } from 'vitest'
import { ELECTRODOM_CONFIG, ShopifyAdapter, type ShopifyProduct } from './shopify.adapter'

const adapter = new ShopifyAdapter(ELECTRODOM_CONFIG, 0)

const product = (over: Partial<ShopifyProduct> = {}): ShopifyProduct => ({
  id: 1, title: 'Horno freidora de aire DRIJA BRUSCHETTA 25L-B', handle: 'horno-freidora-de-aire-drija-bruschetta-25l-b',
  vendor: 'DRIJA', product_type: 'Horno freidora de aire', images: [{ src: 'https://cdn.shopify.com/a.jpg' }],
  variants: [{ price: '11900.00', compare_at_price: '13900.00', sku: null, barcode: null, available: true }], ...over,
})

describe('ShopifyAdapter.normalize', () => {
  it('maps price, brand, category, link and previous price', () => {
    expect(adapter.normalize(product())).toMatchObject({
      retailer: { slug: 'electrodom' }, externalSku: '1', brand: 'Drija', price: 11900, available: true,
      categoryName: 'Horno freidora de aire', sourceUrl: 'https://www.electrodom.com.do/products/horno-freidora-de-aire-drija-bruschetta-25l-b',
      imageUrl: 'https://cdn.shopify.com/a.jpg', raw: { compareAtPrice: '13900.00' },
    })
  })

  it('uses the product id as model and the type as subtitle when the title has no model code', () => {
    const item = adapter.normalize(product({ id: 777 }))!
    expect(item.model).toBe('777')
    expect(item.subtitle).toBe('Horno freidora de aire')
  })

  it('files non-appliance store types under the generic appliance category', () => {
    expect(adapter.normalize(product({ product_type: 'Vinera' }))!.categoryName).toBe('Electrodomésticos')
    expect(adapter.normalize(product({ product_type: 'Estufa' }))!.categoryName).toBe('Estufa')
  })

  it('skips sinks, faucets, cookware and products without a price', () => {
    expect(adapter.normalize(product({ product_type: 'Fregadero' }))).toBeNull()
    expect(adapter.normalize(product({ product_type: 'Grifería' }))).toBeNull()
    expect(adapter.normalize(product({ product_type: 'Juego de ollas y sartenes' }))).toBeNull()
    expect(adapter.normalize(product({ variants: [{ price: '0.00' }] }))).toBeNull()
  })

  it('marks products with no available variant as unavailable', () => {
    expect(adapter.normalize(product({ variants: [{ price: '100', available: false }] }))!.available).toBe(false)
  })
})
