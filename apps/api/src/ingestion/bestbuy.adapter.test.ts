import { describe, expect, it } from 'vitest'
import { BestBuyAdapter, type BestBuyProduct } from './bestbuy.adapter'

const adapter = new BestBuyAdapter({ apiKey: 'k', categoryIds: ['abcat0900000'], websiteUrl: 'https://www.bestbuy.com' })

const fridge: BestBuyProduct = {
  sku: 6500001, name: 'Samsung - 28 Cu. Ft. French Door Refrigerator', manufacturer: 'Samsung', modelNumber: 'RF28T5001SR',
  upc: '887276379420', salePrice: 1199.99, regularPrice: 1399.99, onlineAvailability: true,
  image: 'https://pisces.bbystatic.com/image.jpg', url: 'https://www.bestbuy.com/site/6500001.p',
  categoryPath: [{ id: 'cat00000', name: 'Best Buy' }, { id: 'abcat0901000', name: 'Refrigerators' }],
}

describe('BestBuyAdapter.normalize', () => {
  it('maps a product with the sale price, UPC and most specific category', () => {
    expect(adapter.normalize(fridge)).toMatchObject({
      retailer: { slug: 'best-buy' }, externalSku: '6500001', name: fridge.name, brand: 'Samsung', model: 'RF28T5001SR',
      upc: '887276379420', categoryName: 'Refrigerators', categorySlug: 'refrigerators', price: 1199.99, available: true,
    })
  })

  it('falls back to the regular price and marks unavailable products', () => {
    const item = adapter.normalize({ ...fridge, salePrice: undefined, onlineAvailability: false })!
    expect(item.price).toBe(1399.99)
    expect(item.available).toBe(false)
  })

  it('skips products without a name, sku or any price', () => {
    expect(adapter.normalize({ ...fridge, name: undefined })).toBeNull()
    expect(adapter.normalize({ ...fridge, salePrice: undefined, regularPrice: undefined })).toBeNull()
  })

  it('ignores a malformed UPC', () => {
    expect(adapter.normalize({ ...fridge, upc: '123' })!.upc).toBeUndefined()
  })
})
