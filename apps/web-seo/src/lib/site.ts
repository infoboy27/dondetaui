// Server-only: each deployment (dev on dondeta.jfmcss.com, production on
// dondeta.com.do) sets its own SITE_URL, since this app is deployed to
// multiple domains from the same image. Used for canonical URLs, sitemap.xml,
// robots.txt, and metadataBase -- getting this wrong actively misdirects
// search engines toward the wrong domain.
export const SITE_URL = process.env.SITE_URL ?? 'https://dondeta.jfmcss.com'

// Country the data-driven pages talk about (/precios, /comparaciones...).
// Per deployment, like SITE_URL; the DR stack is the default.
export const COUNTRY_NAME = process.env.COUNTRY_NAME ?? 'República Dominicana'
