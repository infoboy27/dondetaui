// Sears México (Grupo Carso, unrelated to the defunct US chain) uses a
// public search-only Algolia key exposed client-side, same pattern as
// Alkosto/Ktronix but a different Algolia account and a different
// (richer) schema -- real EAN, numeric stock, is_active flag -- so it
// gets its own adapter rather than reusing algolia-api.adapter.ts's
// Alkosto-shaped normalize().
export interface SearsConfig {
  appId: string
  apiKey: string
  indexName: string
  websiteUrl: string
  // Algolia `filters` syntax; confirmed live to return only Línea Blanca y
  // Electrodomésticos (refrigeradores, estufas, lavadoras) -- 7000+ hits.
  categoryFilter: string
}

export const SEARS_CONFIG: SearsConfig = {
  appId: '6M62U1ZBKU',
  apiKey: '6698ccede119391b5f6db5c39352b1f2',
  indexName: 'sears',
  websiteUrl: 'https://www.sears.com.mx',
  categoryFilter: 'hirerarchical_category.lvl0:"línea blanca y electrodomésticos"',
}
