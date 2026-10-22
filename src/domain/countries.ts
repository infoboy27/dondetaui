// The DóndeTa country sites. Each is a separate deployment (own catalog,
// stores and currency); the web only links between them. It never redirects
// by language: crawlers and shared links must land where they were pointed.
export type CountryCode = 'DO' | 'CO' | 'MX' | 'US'

export interface CountrySite {
  code: CountryCode
  name: string
  flag: string
  /** "tiendas dominicanas" */
  storesAdjective: string
  url: string
  /** Hostnames that serve this country. */
  hosts: string[]
  /** Listed in the switcher once the site is publicly available. */
  live: boolean
}

export const COUNTRY_SITES: CountrySite[] = [
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴', storesAdjective: 'dominicanas', url: 'https://dondeta.com.do', hosts: ['dondeta.com.do', 'www.dondeta.com.do'], live: true },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', storesAdjective: 'colombianas', url: 'https://co.dondeta.com.do', hosts: ['co.dondeta.com.do', 'dondeta.co', 'www.dondeta.co'], live: true },
  { code: 'MX', name: 'México', flag: '🇲🇽', storesAdjective: 'mexicanas', url: 'https://mx.dondeta.com.do', hosts: ['mx.dondeta.com.do', 'dondeta.mx', 'www.dondeta.mx'], live: true },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', storesAdjective: 'estadounidenses', url: 'https://us.dondeta.com.do', hosts: ['us.dondeta.com.do'], live: false },
]

/** The country site for a hostname; DR for anything unknown (localhost, previews). */
export function countryForHost(hostname: string): CountrySite {
  const host = hostname.toLowerCase()
  return COUNTRY_SITES.find(site => site.hosts.includes(host)) ?? COUNTRY_SITES[0]!
}

/** The live country site matching a browser language ("es-MX"), if any. */
export function countryForLanguage(language: string | undefined): CountrySite | null {
  const region = language?.split(/[-_]/)[1]?.toUpperCase()
  return COUNTRY_SITES.find(site => site.live && site.code === region) ?? null
}
