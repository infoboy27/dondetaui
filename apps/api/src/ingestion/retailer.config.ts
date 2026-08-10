export type RetailerKey = 'jumbo' | 'sirena' | 'corripio' | 'pricesmart'

export interface RetailerConfig {
  key: RetailerKey
  name: string
  slug: string
  abbr: string
  primaryColor: string
  origin: string
  websiteUrl: string
  seedUrls: string[]
  crawlPrefixes: string[]
  productPatterns: RegExp[]
  excludedPrefixes: string[]
  defaultCategory: { name: string; slug: string }
}

export const RETAILER_CONFIGS: Record<RetailerKey, RetailerConfig> = {
  jumbo: {
    key: 'jumbo', name: 'Jumbo', slug: 'jumbo', abbr: 'JU', primaryColor: '#66A61E',
    origin: 'https://jumbo.com.do', websiteUrl: 'https://jumbo.com.do',
    seedUrls: ['https://jumbo.com.do/supermercado', 'https://jumbo.com.do/electrodomesticos', 'https://jumbo.com.do/tv-y-tecnologia', 'https://jumbo.com.do/hogar'],
    crawlPrefixes: ['/supermercado', '/electrodomesticos', '/tv-y-tecnologia', '/hogar', '/belleza', '/deportes', '/bebe', '/juguetes', '/ferreteria', '/cocina'],
    productPatterns: [/\.html$/i, /\/(?:product|producto|p)\//i],
    excludedPrefixes: ['/customer', '/checkout', '/cart', '/wishlist', '/search'],
    defaultCategory: { name: 'Jumbo', slug: 'jumbo' },
  },
  sirena: {
    key: 'sirena', name: 'Sirena', slug: 'sirena', abbr: 'SI', primaryColor: '#0072BC',
    origin: 'https://www.sirena.do', websiteUrl: 'https://www.sirena.do',
    seedUrls: ['https://www.sirena.do/supermercado', 'https://www.sirena.do/belleza'],
    crawlPrefixes: ['/supermercado', '/belleza', '/hogar', '/tecnologia', '/electrodomesticos'],
    // VTEX storefront: product URLs are slug-<sku>/p (suffix), not a /p/ path segment.
    productPatterns: [/\/p$/i],
    excludedPrefixes: ['/login', '/account', '/cart', '/checkout', '/search', '/ayuda'],
    defaultCategory: { name: 'Supermercado', slug: 'supermercado' },
  },
  corripio: {
    key: 'corripio', name: 'Tiendas Corripio', slug: 'corripio', abbr: 'CO', primaryColor: '#E31E24',
    origin: 'https://www.tiendascorripio.com.do', websiteUrl: 'https://www.tiendascorripio.com.do',
    seedUrls: ['https://www.tiendascorripio.com.do/all-products'],
    crawlPrefixes: ['/all-products', '/refrigeracion', '/coccion', '/lavado', '/climatizacion', '/televisores', '/audio', '/tecnologia', '/pequenos-electrodomesticos', '/hogar'],
    productPatterns: [/\.html$/i],
    excludedPrefixes: ['/customer', '/checkout', '/cart', '/wishlist', '/search', '/envios-y-devoluciones', '/preguntas-frecuentes', '/politicas'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  pricesmart: {
    key: 'pricesmart', name: 'PriceSmart', slug: 'pricesmart', abbr: 'PS', primaryColor: '#00529B',
    origin: 'https://www.pricesmart.com', websiteUrl: 'https://www.pricesmart.com/es-do',
    // The bare homepage is a category picker with 0 product links — seed the real
    // category index + a few known sections so discovery has something to crawl into.
    seedUrls: [
      'https://www.pricesmart.com/es-do/categorias',
      'https://www.pricesmart.com/es-do/linea-blanca',
      'https://www.pricesmart.com/es-do/lo-nuevo',
      'https://www.pricesmart.com/es-do/members-selection',
    ],
    crawlPrefixes: ['/es-do'],
    productPatterns: [/\/(?:product|producto|p)\//i],
    excludedPrefixes: ['/es-do/account', '/es-do/cart', '/es-do/checkout', '/es-do/membership'],
    defaultCategory: { name: 'PriceSmart', slug: 'pricesmart' },
  },
}
