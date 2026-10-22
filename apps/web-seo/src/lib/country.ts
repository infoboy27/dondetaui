// Pure country helpers (no direct process.env reads except via the `env`
// argument) so they can be unit-tested. site.ts instantiates them from the
// real environment. Defaults reproduce the Dominican Republic site exactly.

export type CountryCode = 'DO' | 'CO' | 'MX' | 'US'

export interface Country {
  code: CountryCode
  name: string
  /** Plural feminine demonym, used as "tiendas {adjective}". */
  adjective: string
  isDominican: boolean
}

type Env = Record<string, string | undefined>

const CODES: readonly CountryCode[] = ['DO', 'CO', 'MX', 'US']

export function buildCountry(env: Env): Country {
  const raw = (env.COUNTRY_CODE || 'DO').toUpperCase()
  const code = (CODES as readonly string[]).includes(raw) ? (raw as CountryCode) : 'DO'
  return {
    code,
    name: env.COUNTRY_NAME || 'República Dominicana',
    adjective: env.COUNTRY_ADJECTIVE || 'dominicanas',
    isDominican: code === 'DO',
  }
}

/** Short form used in running text ("tiendas de RD"). */
export function countryShortName(c: Country): string {
  return c.isDominican ? 'RD' : c.name
}

export function htmlLang(c: Country): string {
  return `es-${c.code}`
}

export function currencyCode(c: Country): string {
  return { DO: 'DOP', CO: 'COP', MX: 'MXN', US: 'USD' }[c.code]
}

export function timeZone(c: Country): string {
  return {
    DO: 'America/Santo_Domingo',
    CO: 'America/Bogota',
    MX: 'America/Mexico_City',
    US: 'America/New_York',
  }[c.code]
}

/** DR is always indexable; other countries only with COUNTRY_INDEXABLE=1. */
export function isIndexable(c: Country, env: Env): boolean {
  return c.isDominican || env.COUNTRY_INDEXABLE === '1'
}

/** Whether the DR-specific editorial content (guides) is served. */
export function hasGuides(c: Country): boolean {
  return c.isDominican
}

export function homeTitle(c: Country): string {
  return `DóndeTa — precios e historial de electrodomésticos en ${c.name}`
}

export function homeDescription(c: Country): string {
  return `DóndeTa registra los precios publicados de electrodomésticos, aires, neveras, lavadoras y televisores en tiendas ${c.adjective} y muestra su historial para darte contexto antes de comprar.`
}

export function categoryDescription(c: Country, label: string, count: number): string {
  return `Precios publicados e historial de ${label.toLowerCase()} en tiendas de ${c.name}. ${count} productos monitoreados en DóndeTa.`
}

export function storeDescription(c: Country, storeName: string, count: number): string {
  return `Compara los precios de ${count} productos en ${storeName} contra otras tiendas de ${c.name}.`
}

export function productDescription(
  c: Country,
  name: string,
  best: { price: string; store: string } | undefined,
  storeCount: number,
): string {
  if (!best) return `Ficha e historial de precio de ${name} en ${c.name}.`
  return storeCount >= 2
    ? `Compara el precio de ${name} entre ${storeCount} tiendas en ${c.name}. Precio más bajo: ${best.price} en ${best.store}. Historial de precios y enlaces para verificar.`
    : `${name} en ${best.store}: ${best.price}. Historial de precios publicados, ficha básica y enlace para verificar en la tienda. ${c.name}.`
}
