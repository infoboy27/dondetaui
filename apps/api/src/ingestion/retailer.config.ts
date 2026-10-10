// PriceSmart is not here — its catalog is Nuxt client-rendered like Plaza Lama's, so it
// gets its own Playwright-based pipeline (pricesmart.discovery.ts / pricesmart.adapter.ts
// / pricesmart.cli.ts) instead of this generic fetch()-based one.
export type RetailerKey = 'jumbo' | 'sirena' | 'corripio'

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
  // Paginated listing mode: instead of a breadth-first crawl (which drowns in
  // filter/nav URLs), walk each seed's own pages ?<param>=2..N, where N comes
  // from the product total the page reports (totalPattern's first group), or --
  // without one -- until a page adds no product not already seen.
  pagination?: { param: string; totalPattern?: RegExp; maxPagesPerSeed: number }
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
    // Listings show 16 per page (product_list_limit is ignored); page 2+ link
    // products under their category path (/electro-hogar/lavado-y-secado/<slug>-<sku>)
    // instead of the bare /<slug>-<sku> page 1 uses -- both shapes are matched.
    // Belleza y salud (hair dryers, shavers) is left out on purpose.
    seedUrls: [
      'https://jumbo.com.do/electro-hogar/climatizacion',
      'https://jumbo.com.do/electro-hogar/electro-cocina',
      'https://jumbo.com.do/electro-hogar/estufas-y-hornos',
      'https://jumbo.com.do/electro-hogar/lavado-y-secado',
      'https://jumbo.com.do/electro-hogar/planchas-y-aspiradoras',
      'https://jumbo.com.do/electro-hogar/refrigeracion',
      'https://jumbo.com.do/tv-y-tecnologia/televisores',
    ],
    crawlPrefixes: ['/electro-hogar', '/tv-y-tecnologia/televisores'],
    productPatterns: [
      /^\/{1,2}[a-z0-9](?:[a-z0-9-]*[a-z0-9])?-\d{6,}$/i,
      /^\/(?:electro-hogar|tv-y-tecnologia)\/(?:[a-z0-9-]+\/)*[a-z0-9-]*[a-z][a-z0-9-]*-\d{7,}$/i,
      /\.html$/i,
      /\/(?:product|producto|p)\//i,
    ],
    pagination: { param: 'p', totalPattern: /toolbar-number">(\d+)/g, maxPagesPerSeed: 40 },
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
    // The short department URLs (/refrigeracion...) render page 1 of
    // /all-products?cat=<id>; later pages only exist under that URL (?p=N,
    // 12 per page, no total shown). /pequenos-electrodomesticos is a 404 -- the
    // real path is /peque-os-electrodomesticos.html.
    seedUrls: [
      'https://www.tiendascorripio.com.do/all-products?cat=3431', // refrigeración
      'https://www.tiendascorripio.com.do/all-products?cat=3452', // cocción
      'https://www.tiendascorripio.com.do/all-products?cat=3497', // lavado
      'https://www.tiendascorripio.com.do/all-products?cat=3485', // climatización
      'https://www.tiendascorripio.com.do/all-products?cat=292', // televisores
      'https://www.tiendascorripio.com.do/peque-os-electrodomesticos.html',
    ],
    crawlPrefixes: ['/refrigeracion', '/coccion', '/lavado', '/climatizacion', '/televisores', '/peque-os-electrodomesticos'],
    // Real product URLs are a single flat path segment with a SKU-code prefix, e.g.
    // /an-p18kn-abanico-nedoca-18.html or /btva-argbr1345-base-de-tv-inclinable-32-55.html.
    // Category/subcategory/filter index pages also end in .html but are nested under one
    // or more path segments (/refrigeracion/equipos-especializados/bebederos.html) or, in
    // the rare case they're flat too (/audio.html), never contain a digit — genuine SKUs
    // always do. Both distinctions are needed: /\.html$/i alone was matching every
    // category page too, ingesting them as products with garbage names/RD$0 prices.
    productPatterns: [/^\/[^/?]*\d[^/?]*\.html$/i],
    excludedPrefixes: ['/customer', '/checkout', '/cart', '/wishlist', '/search', '/envios-y-devoluciones', '/preguntas-frecuentes', '/politicas'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
    pagination: { param: 'p', maxPagesPerSeed: 40 },
  },
}
