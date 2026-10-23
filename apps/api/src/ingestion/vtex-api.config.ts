// Many Latin American retailers run on VTEX, which exposes a standard,
// public, undocumented-but-widely-relied-on JSON search API at
// /api/catalog_system/pub/products/search/<category-path> -- confirmed
// working directly (no scraping, no bot-detection hit) for Éxito (CO) and
// Elektra (MX) during initial research. This is a materially better data
// source than HTML scraping where it's available: structured price/stock/
// image fields straight from the retailer's own catalog, not regex-parsed
// out of rendered markup.
export interface VtexRetailerConfig {
  key: string
  name: string
  slug: string
  abbr: string
  primaryColor: string
  websiteUrl: string
  // VTEX search API category paths, e.g. 'linea-blanca' or
  // 'electrodomesticos/lavado' -- one search call (paginated) per path.
  categoryPaths: string[]
  defaultCategory: { name: string; slug: string }
}

export const VTEX_RETAILER_CONFIGS: Record<string, VtexRetailerConfig> = {
  exito: {
    key: 'exito', name: 'Éxito', slug: 'exito', abbr: 'EX', primaryColor: '#FFD100',
    websiteUrl: 'https://www.exito.com',
    // Deliberately just /electrodomesticos, not the broader /tecnologia
    // (phones, software licenses, chargers) -- ingestion.repository.ts's
    // isApplianceCategory() would reject that non-appliance noise anyway,
    // but there's no reason to spend requests fetching it in the first
    // place. Confirmed live: this path returns clean appliance categories
    // (Refrigeración/Neveras, Climatización/Ventiladores, etc.).
    categoryPaths: ['electrodomesticos'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  elektra: {
    key: 'elektra', name: 'Elektra', slug: 'elektra', abbr: 'EL', primaryColor: '#E30613',
    websiteUrl: 'https://www.elektra.mx',
    categoryPaths: ['linea-blanca'],
    defaultCategory: { name: 'Línea Blanca', slug: 'linea-blanca' },
  },
  sirena: {
    key: 'sirena', name: 'Sirena', slug: 'sirena', abbr: 'SI', primaryColor: '#0072BC',
    websiteUrl: 'https://www.sirena.do',
    // Replaces the HTML crawler (retailer.cli.ts sirena), whose discovery only
    // ever reached ~70 of the ~430 appliances. Same retailer slug, so offers
    // and history stay on the same retailer row. Appliance subtrees only --
    // /electrodomesticos also holds laptops, phones and batteries.
    categoryPaths: [
      'electrodomesticos/climatizacion',
      'electrodomesticos/electrodomesticos-de-cocina',
      'electrodomesticos/electrodomesticos-pequenos',
      'electrodomesticos/lavado-y-secado',
      'electrodomesticos/televisores-y-barras-de-sonido',
    ],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  // Colombian retailers on VTEX (public catalog API, checked 2026-10). Appliance and TV
  // subtrees only; ingestion.repository.ts still rejects non-appliance categories.
  'jumbo-colombia': {
    key: 'jumbo-colombia', name: 'Jumbo', slug: 'jumbo-colombia', abbr: 'JC', primaryColor: '#00A859',
    websiteUrl: 'https://www.jumbocolombia.com',
    categoryPaths: [
      'electrodomesticos/cocina',
      'electrodomesticos/lavadoras-y-secadoras',
      'electrodomesticos/climatizacion',
      'electrodomesticos/refrigeracion',
      'electrodomesticos/pequenos-electrodomesticos',
      'televisores-y-audio/television',
    ],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  olimpica: {
    key: 'olimpica', name: 'Olímpica', slug: 'olimpica', abbr: 'OL', primaryColor: '#E2001A',
    websiteUrl: 'https://www.olimpica.com',
    categoryPaths: ['electrodomesticos-y-tecnologia/electro-hogar', 'electrodomesticos-y-tecnologia/tv-audio-y-video'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  panamericana: {
    key: 'panamericana', name: 'Panamericana', slug: 'panamericana', abbr: 'PA', primaryColor: '#D71920',
    websiteUrl: 'https://www.panamericana.com.co',
    categoryPaths: ['hogar/electro', 'tecnologia/tv-y-video'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  chedraui: {
    key: 'chedraui', name: 'Chedraui', slug: 'chedraui', abbr: 'CH', primaryColor: '#EE1C25',
    websiteUrl: 'https://www.chedraui.com.mx',
    // Confirmed live: this path returns clean appliance categories
    // (Refrigeradores y frigobares, Lavado y secado, Planchado).
    categoryPaths: ['electrodomesticos-y-linea-blanca'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
}
