import { describe, expect, it } from 'vitest'
import { hifiCategory, hifiFinalPrice, normalizeHifiProduct, parseListingPage, type HifiProduct } from './hifi.adapter'

const cat = (slug: string, name: string, tag_id = 2) => ({ id: slug.length, slug, name, tag_id })

// Trimmed from hifi.com.do/linea-blanca?page=2 (Inertia data-page props), 2026-11-14.
const BEBEDERO: HifiProduct = {
  id: 9799,
  name: 'BEBEDERO BLANCO KENMORE',
  slug: 'bebedero-blanco-kenmore-BTCSWS',
  status: 'active',
  sku: 'BTCSWS',
  price: 8400,
  discount: '15.00',
  stock: 6,
  categories: [cat('linea-blanca', 'Línea Blanca'), cat('bebederos', 'Bebederos'), cat('refrigeracion', 'Refrigeración'), cat('kenmore', 'Kenmore', 4), cat('ofertas', 'Ofertas')],
  files: [{ path: 'images/kenmore/BTCSWS.jpg' }],
  card_discount: { name: 'Banco Popular - 15%' },
}

const TWIN_TUB: HifiProduct = {
  id: 9609,
  name: 'LAVADORA DE ROPA TWIN TUB  13 KG ACROS',
  slug: 'lavadora-de-ropa-twin-tub-13-kg-acros-ALD1345PE',
  status: 'active',
  sku: 'ALD1345PE',
  price: 12800,
  discount: '15.00',
  stock: 2,
  categories: [cat('linea-blanca', 'Línea Blanca'), cat('lavado', 'Lavado'), cat('lavadoras', 'Lavadoras'), cat('twin-tub', 'Twin tub', 4), cat('acros', 'Acros', 4)],
  files: [{ path: 'images/ALD1345PE.jpg' }],
}

const TV: HifiProduct = {
  id: 9775,
  name: "TELEVISOR 65'' SMART 4K HDR SONY",
  slug: 'televisor-65-smart-4k-hdr-sony-1-K65S30',
  status: 'active',
  sku: 'K65S30',
  price: 102800,
  discount: '20.00',
  stock: 0,
  categories: [cat('electronica', 'Electrónica'), cat('sony', 'Sony', 4), cat('televisores', 'Televisores')],
  files: [],
}

const FILTER: HifiProduct = {
  id: 9001,
  name: 'FILTRO ALUMINIO PARA EXTRACTOR 60 DRIJA',
  slug: 'filtro-aluminio-para-extractor-60-drija-F60',
  status: 'active',
  sku: 'F60',
  price: 880,
  discount: '15.00',
  stock: 6,
  categories: [cat('repuestos', 'Repuestos'), cat('extractores', 'Extractores'), cat('drija', 'Drija', 4)],
}

function inertiaHtml(products: HifiProduct[], current = 2, last = 33): string {
  const page = { component: 'Products/ProductList', props: { products: { current_page: current, last_page: last, data: products } } }
  const attribute = JSON.stringify(page).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  return `<!DOCTYPE html><html><body><div id="app" data-page="${attribute}"></div></body></html>`
}

describe('parseListingPage', () => {
  it('reads products and pagination from the Inertia data-page attribute', () => {
    const page = parseListingPage(inertiaHtml([BEBEDERO, TV]))
    expect(page.currentPage).toBe(2)
    expect(page.lastPage).toBe(33)
    expect(page.products.map(p => p.name)).toEqual(['BEBEDERO BLANCO KENMORE', "TELEVISOR 65'' SMART 4K HDR SONY"])
    expect(page.products[0]!.categories?.[0]?.name).toBe('Línea Blanca')
  })

  it('fails loudly when the page no longer embeds products', () => {
    expect(() => parseListingPage('<html><div id="app"></div></html>')).toThrow(/data-page/)
  })
})

describe('hifiFinalPrice', () => {
  it('applies the store-wide discount, as the product page does (8,400 - 15% = 7,140)', () => {
    expect(hifiFinalPrice(BEBEDERO)).toBe(7140)
    expect(hifiFinalPrice({ price: 9799.99, discount: '0.00' })).toBe(9799.99)
    expect(hifiFinalPrice({ price: 89799.99, discount: '15.00' })).toBe(76329.99)
  })

  it('ignores missing or nonsense discounts and rejects missing prices', () => {
    expect(hifiFinalPrice({ price: 1000, discount: null })).toBe(1000)
    expect(hifiFinalPrice({ price: 1000, discount: '100.00' })).toBe(1000)
    expect(hifiFinalPrice({ price: 0, discount: '10' })).toBeNaN()
  })
})

describe('hifiCategory', () => {
  it('prefers the most specific category', () => {
    expect(hifiCategory(TWIN_TUB)).toEqual({ name: 'Lavadoras', slug: 'lavadoras' })
    expect(hifiCategory(TV)).toEqual({ name: 'Televisores', slug: 'televisores' })
    expect(hifiCategory(BEBEDERO)).toEqual({ name: 'Electrodomésticos', slug: 'electrodomesticos' })
  })

  it('skips spare parts and products with only brand or offer pages', () => {
    expect(hifiCategory(FILTER)).toBeNull()
    expect(hifiCategory({ categories: [cat('ofertas', 'Ofertas'), cat('premium', 'Premium', 4)] })).toBeNull()
  })
})

describe('normalizeHifiProduct', () => {
  it('maps a product to a DóndeTa offer', () => {
    expect(normalizeHifiProduct(BEBEDERO)).toMatchObject({
      retailer: { name: 'HI-FI', slug: 'hifi', abbr: 'HF' },
      externalSku: '9799',
      sourceUrl: 'https://hifi.com.do/linea-blanca/bebedero-blanco-kenmore-BTCSWS',
      name: 'Bebedero Blanco Kenmore',
      brand: 'Kenmore',
      model: 'BTCSWS',
      categorySlug: 'electrodomesticos',
      imageUrl: 'https://hifi.com.do/storage/images/kenmore/BTCSWS.jpg',
      price: 7140,
      available: true,
      raw: { listPrice: 8400, discount: 15, cardDiscount: 'Banco Popular - 15%' },
    })
  })

  it('takes the brand from a brand page, not a product-type page that shares its tag', () => {
    const item = normalizeHifiProduct(TWIN_TUB)!
    expect(item.brand).toBe('Acros')
    expect(item.name).toBe('Lavadora De Ropa Twin Tub 13 Kg Acros')
  })

  it('marks out-of-stock products unavailable and leaves the image empty when there is none', () => {
    const item = normalizeHifiProduct(TV)!
    expect(item.available).toBe(false)
    expect(item.imageUrl).toBeUndefined()
    expect(item.price).toBe(82240)
  })

  it('skips non-appliances and inactive products', () => {
    expect(normalizeHifiProduct(FILTER)).toBeNull()
    expect(normalizeHifiProduct({ ...BEBEDERO, status: 'inactive' })).toBeNull()
  })
})
