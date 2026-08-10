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
  // DóndeTa only covers electrodomésticos (appliances) — every retailer below is
  // deliberately seeded from and restricted to its appliance department only.
  // Broader seeds (site-wide "all products", supermarket, beauty, homepage) walk
  // the crawler into every department the retailer sells, which is how Plaza Lama
  // ended up ingesting backpacks, beer, and toilets before this was scoped down.
  jumbo: {
    key: 'jumbo', name: 'Jumbo', slug: 'jumbo', abbr: 'JU', primaryColor: '#66A61E',
    origin: 'https://jumbo.com.do', websiteUrl: 'https://jumbo.com.do',
    seedUrls: ['https://jumbo.com.do/electrodomesticos'],
    crawlPrefixes: ['/electrodomesticos'],
    productPatterns: [/\.html$/i, /\/(?:product|producto|p)\//i],
    excludedPrefixes: ['/customer', '/checkout', '/cart', '/wishlist', '/search'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  sirena: {
    key: 'sirena', name: 'Sirena', slug: 'sirena', abbr: 'SI', primaryColor: '#0072BC',
    origin: 'https://www.sirena.do', websiteUrl: 'https://www.sirena.do',
    seedUrls: ['https://www.sirena.do/electrodomesticos'],
    crawlPrefixes: ['/electrodomesticos'],
    // VTEX storefront: product URLs are slug-<sku>/p (suffix), not a /p/ path segment.
    productPatterns: [/\/p$/i],
    excludedPrefixes: ['/login', '/account', '/cart', '/checkout', '/search', '/ayuda'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  corripio: {
    key: 'corripio', name: 'Tiendas Corripio', slug: 'corripio', abbr: 'CO', primaryColor: '#E31E24',
    origin: 'https://www.tiendascorripio.com.do', websiteUrl: 'https://www.tiendascorripio.com.do',
    // Category-specific pages, not /all-products (Corripio's entire catalog) or
    // /hogar (furniture/home decor, not appliances).
    seedUrls: [
      'https://www.tiendascorripio.com.do/refrigeracion',
      'https://www.tiendascorripio.com.do/coccion',
      'https://www.tiendascorripio.com.do/lavado',
      'https://www.tiendascorripio.com.do/climatizacion',
      'https://www.tiendascorripio.com.do/televisores',
      'https://www.tiendascorripio.com.do/pequenos-electrodomesticos',
    ],
    crawlPrefixes: ['/refrigeracion', '/coccion', '/lavado', '/climatizacion', '/televisores', '/pequenos-electrodomesticos'],
    productPatterns: [/\.html$/i],
    excludedPrefixes: ['/customer', '/checkout', '/cart', '/wishlist', '/search', '/envios-y-devoluciones', '/preguntas-frecuentes', '/politicas'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  pricesmart: {
    key: 'pricesmart', name: 'PriceSmart', slug: 'pricesmart', abbr: 'PS', primaryColor: '#00529B',
    origin: 'https://www.pricesmart.com', websiteUrl: 'https://www.pricesmart.com/es-do',
    // "línea blanca" = major appliances (fridges/washers/stoves) in DR retail
    // terminology. Not /es-do (matches the entire site) or /categorias (picker).
    seedUrls: ['https://www.pricesmart.com/es-do/linea-blanca'],
    crawlPrefixes: ['/es-do/linea-blanca'],
    productPatterns: [/\/(?:product|producto|p)\//i],
    excludedPrefixes: ['/es-do/account', '/es-do/cart', '/es-do/checkout', '/es-do/membership'],
    defaultCategory: { name: 'Línea Blanca', slug: 'linea-blanca' },
  },
}
