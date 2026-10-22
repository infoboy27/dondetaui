import { buildCountry } from './country'

// Server-only: each deployment (dev on dondeta.jfmcss.com, production on
// dondeta.com.do) sets its own SITE_URL, since this app is deployed to
// multiple domains from the same image. Used for canonical URLs, sitemap.xml,
// robots.txt, and metadataBase -- getting this wrong actively misdirects
// search engines toward the wrong domain.
export const SITE_URL = process.env.SITE_URL ?? 'https://dondeta.jfmcss.com'

// Country the pages talk about. Per deployment, like SITE_URL; the DR stack
// is the default. Read at module load in the server process (runtime env),
// and every page that uses it is force-dynamic, same as SITE_URL.
export const COUNTRY = buildCountry(process.env)
export const COUNTRY_NAME = COUNTRY.name

// Mirrors src/domain/currency.ts, but this is a server-rendered app so the
// values come from plain runtime env vars (set per country stack in
// docker-compose.yml) rather than a build-time Vite define.
export const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL || 'RD$'
export const CURRENCY_LOCALE = process.env.CURRENCY_LOCALE || 'es-DO'
