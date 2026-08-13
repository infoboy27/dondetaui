// Falabella Colombia server-renders its search results into a Next.js
// __NEXT_DATA__ JSON blob on the initial HTML response (confirmed live: a
// plain fetch with no special headers gets full results, no bot-detection
// hit -- the platform is Cloudflare-fronted but doesn't challenge normal
// page requests, only a guessed nonexistent API path did).
//
// There's no reliable per-item category field in the search response, so
// (like a keyword-scoped VTEX categoryPath) each entry here is a search
// term paired with the category name/slug it represents.
export interface FalabellaSearchTerm {
  query: string
  categoryName: string
  categorySlug: string
}

export interface FalabellaConfig {
  key: string
  name: string
  slug: string
  abbr: string
  primaryColor: string
  websiteUrl: string
  countryPath: string
  searchTerms: FalabellaSearchTerm[]
}

export const FALABELLA_CONFIGS: Record<string, FalabellaConfig> = {
  'falabella-co': {
    key: 'falabella-co', name: 'Falabella', slug: 'falabella-co', abbr: 'FA', primaryColor: '#78BE20',
    websiteUrl: 'https://www.falabella.com.co',
    countryPath: 'falabella-co',
    searchTerms: [
      { query: 'nevera', categoryName: 'Neveras', categorySlug: 'neveras' },
      { query: 'lavadora', categoryName: 'Lavadoras', categorySlug: 'lavadoras' },
      { query: 'secadora de ropa', categoryName: 'Secadoras', categorySlug: 'secadoras' },
      { query: 'estufa', categoryName: 'Estufas', categorySlug: 'estufas' },
      { query: 'horno microondas', categoryName: 'Microondas', categorySlug: 'microondas' },
      { query: 'aire acondicionado', categoryName: 'Aire Acondicionado', categorySlug: 'aire-acondicionado' },
      { query: 'licuadora', categoryName: 'Licuadoras', categorySlug: 'licuadoras' },
      { query: 'aspiradora', categoryName: 'Aspiradoras', categorySlug: 'aspiradoras' },
      { query: 'lavaplatos', categoryName: 'Lavaplatos', categorySlug: 'lavaplatos' },
      { query: 'ventilador', categoryName: 'Ventiladores', categorySlug: 'ventiladores' },
    ],
  },
}
