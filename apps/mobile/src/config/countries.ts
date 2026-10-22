// The countries DóndeTa serves. Each one is its own backend (own catalog,
// retailers and currency), so the app picks which API to talk to by country.
export type CountryCode = 'DO' | 'CO' | 'MX' | 'US'

export interface Country {
  code: CountryCode
  name: string
  flag: string
  apiUrl: string
  currencySymbol: string
  /** Locale for prices and counts. */
  locale: string
  /** Show cents (US prices are 19.99, not whole pesos). */
  cents: boolean
  /** "tiendas dominicanas" */
  storesAdjective: string
  /** Fallback map position for "Tiendas cercanas". */
  center: { label: string; latitude: number; longitude: number }
}

export const COUNTRIES: Record<CountryCode, Country> = {
  DO: {
    code: 'DO', name: 'República Dominicana', flag: '🇩🇴', apiUrl: 'https://dondeta.com.do/api',
    currencySymbol: 'RD$', locale: 'es-DO', cents: false, storesAdjective: 'dominicanas',
    center: { label: 'Santo Domingo', latitude: 18.4861, longitude: -69.9312 },
  },
  CO: {
    code: 'CO', name: 'Colombia', flag: '🇨🇴', apiUrl: 'https://co.dondeta.com.do/api',
    currencySymbol: '$', locale: 'es-CO', cents: false, storesAdjective: 'colombianas',
    center: { label: 'Bogotá', latitude: 4.711, longitude: -74.0721 },
  },
  MX: {
    code: 'MX', name: 'México', flag: '🇲🇽', apiUrl: 'https://mx.dondeta.com.do/api',
    currencySymbol: '$', locale: 'es-MX', cents: false, storesAdjective: 'mexicanas',
    center: { label: 'Ciudad de México', latitude: 19.4326, longitude: -99.1332 },
  },
  US: {
    code: 'US', name: 'Estados Unidos', flag: '🇺🇸', apiUrl: 'https://us.dondeta.com.do/api',
    currencySymbol: 'US$', locale: 'en-US', cents: true, storesAdjective: 'estadounidenses',
    center: { label: 'Nueva York', latitude: 40.7128, longitude: -74.006 },
  },
}

export const COUNTRY_LIST: Country[] = [COUNTRIES.DO, COUNTRIES.CO, COUNTRIES.MX, COUNTRIES.US]

export const DEFAULT_COUNTRY: CountryCode = 'DO'

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && value in COUNTRIES
}

/** The supported country for a device region ("MX"), or null when we don't serve it. */
export function countryFromRegion(region: string | null | undefined): CountryCode | null {
  const code = region?.toUpperCase()
  return isCountryCode(code) ? code : null
}
