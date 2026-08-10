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
    // Jumbo renamed /electrodomesticos to /electro-hogar (301). Product URLs here are a
    // bare single-segment slug+SKU with no /product/ segment or .html suffix (e.g.
    // jumbo.com.do/freidora-de-aire-black-decker-hf5005b-3316834). The category tree also
    // has deeply nested filter/nav paths whose final segment can coincidentally look
    // SKU-like too (e.g. /hogar/cocina-sl-5652), so the pattern below anchors on there
    // being exactly one path segment (no further "/") to tell real products apart.
    seedUrls: ['https://jumbo.com.do/electro-hogar'],
    crawlPrefixes: ['/electro-hogar'],
    productPatterns: [/^\/{1,2}[a-z0-9](?:[a-z0-9-]*[a-z0-9])?-\d{6,}$/i, /\.html$/i, /\/(?:product|producto|p)\//i],
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
