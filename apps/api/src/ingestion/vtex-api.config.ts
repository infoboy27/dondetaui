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
  chedraui: {
    key: 'chedraui', name: 'Chedraui', slug: 'chedraui', abbr: 'CH', primaryColor: '#EE1C25',
    websiteUrl: 'https://www.chedraui.com.mx',
    // Confirmed live: this path returns clean appliance categories
    // (Refrigeradores y frigobares, Lavado y secado, Planchado).
    categoryPaths: ['electrodomesticos-y-linea-blanca'],
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
}
