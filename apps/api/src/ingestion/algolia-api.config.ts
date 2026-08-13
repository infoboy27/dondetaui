// Grupo Alkosto (Colombia) runs Alkosto and Ktronix on the same Algolia
// search application, one index per brand, using a public search-only API
// key that the storefront itself ships in its own JS bundle -- this is
// Algolia's intended public-client pattern (search keys are meant to be
// embedded client-side), not a bypass of anything. Confirmed live by
// reading each site's own generatedVariables.js for its indexName.
export interface AlgoliaRetailerConfig {
  key: string
  name: string
  slug: string
  abbr: string
  primaryColor: string
  websiteUrl: string
  appId: string
  apiKey: string
  indexName: string
  // Algolia `filters` syntax scoping the query to the appliances category
  // tree, e.g. categorypath_string_mv:"BI_ELHO_ALKOS" -- confirmed live to
  // return only Electrodomésticos (Neveras/Lavadoras/etc), same principle
  // as vtex-api.config.ts's categoryPaths.
  categoryFilter: string
  defaultCategory: { name: string; slug: string }
}

export const ALGOLIA_RETAILER_CONFIGS: Record<string, AlgoliaRetailerConfig> = {
  alkosto: {
    key: 'alkosto', name: 'Alkosto', slug: 'alkosto', abbr: 'AK', primaryColor: '#EE3124',
    websiteUrl: 'https://www.alkosto.com',
    appId: 'QX5IPS1B1Q',
    apiKey: '7a8800d62203ee3a9ff1cdf74f99b268',
    indexName: 'alkostoIndexAlgoliaPRD',
    categoryFilter: 'categorypath_string_mv:"BI_ELHO_ALKOS"',
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
  ktronix: {
    key: 'ktronix', name: 'Ktronix', slug: 'ktronix', abbr: 'KT', primaryColor: '#E63027',
    websiteUrl: 'https://www.ktronix.com',
    appId: 'QX5IPS1B1Q',
    apiKey: '7a8800d62203ee3a9ff1cdf74f99b268',
    indexName: 'ktronixIndexAlgoliaPRD',
    categoryFilter: 'categorypath_string_mv:"BI_ELHO_KTRON"',
    defaultCategory: { name: 'Electrodomésticos', slug: 'electrodomesticos' },
  },
}
