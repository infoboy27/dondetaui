import { countryForHost, type CountryCode } from './countries'

// Per-country wording and thresholds for the social posts (Instagram cards and
// captions, Facebook posts). Each country is its own deployment and its own
// account, so a post only talks about its own stores, currency and city.
export interface SocialProfile {
  code: CountryCode
  /**
   * Multiplier from Dominican pesos. The sharing thresholds and the product-type
   * price floors were tuned in RD$; each country scales them to its currency.
   * Approximate on purpose: they only decide what is "worth a post".
   */
  priceScale: number
  location: string
  /** "Comparamos precios de las tiendas de RD por ti" */
  storesPhrase: string
  /** "los 5 televisores más baratos de RD" */
  cheapestOf: string
  /** "Síguenos para más ofertas de RD" */
  followLine: string
  /** Country and savings hashtags; the product-type one is added in between. */
  tags: { offers: string; city: string; savings: string }
  timeZone: string
  locale: string
  /** Spanish with an English line (Hispanic audience in the US). */
  bilingual: boolean
}

export const SOCIAL_PROFILES: Record<CountryCode, SocialProfile> = {
  DO: {
    code: 'DO', priceScale: 1, location: '📍 Santo Domingo, República Dominicana',
    storesPhrase: 'las tiendas de RD', cheapestOf: 'de RD', followLine: 'ofertas de RD',
    tags: { offers: '#OfertasRD', city: '#SantoDomingo', savings: '#AhorroRD' },
    timeZone: 'America/Santo_Domingo', locale: 'es-DO', bilingual: false,
  },
  CO: {
    code: 'CO', priceScale: 65, location: '📍 Bogotá, Colombia',
    storesPhrase: 'las tiendas de Colombia', cheapestOf: 'de Colombia', followLine: 'ofertas de Colombia',
    tags: { offers: '#OfertasColombia', city: '#Bogotá', savings: '#AhorroColombia' },
    timeZone: 'America/Bogota', locale: 'es-CO', bilingual: false,
  },
  MX: {
    code: 'MX', priceScale: 0.3, location: '📍 Ciudad de México, México',
    storesPhrase: 'las tiendas de México', cheapestOf: 'de México', followLine: 'ofertas de México',
    tags: { offers: '#OfertasMéxico', city: '#CDMX', savings: '#AhorroMéxico' },
    timeZone: 'America/Mexico_City', locale: 'es-MX', bilingual: false,
  },
  US: {
    code: 'US', priceScale: 0.017, location: '📍 Estados Unidos',
    storesPhrase: 'las tiendas de EE. UU.', cheapestOf: 'de EE. UU.', followLine: 'ofertas de EE. UU.',
    tags: { offers: '#OfertasUSA', city: '#Latinos', savings: '#SaveMoney' },
    timeZone: 'America/New_York', locale: 'es-US', bilingual: true,
  },
}

/** The profile of the site this code runs on (the cards are drawn in the browser). */
export function currentSocialProfile(): SocialProfile {
  const host = typeof window === 'undefined' ? '' : window.location.hostname
  return SOCIAL_PROFILES[countryForHost(host).code]
}

/** The English counterpart of a line, only for bilingual profiles (else an empty list to spread). */
export function englishLine(profile: SocialProfile, text: string): string[] {
  return profile.bilingual ? [text] : []
}
