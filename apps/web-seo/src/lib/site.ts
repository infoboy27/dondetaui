// Server-only: each deployment (dev on dondeta.jfmcss.com, production on
// dondeta.com.do) sets its own SITE_URL, since this app is deployed to
// multiple domains from the same image. Used for canonical URLs, sitemap.xml,
// robots.txt, and metadataBase -- getting this wrong actively misdirects
// search engines toward the wrong domain.
export const SITE_URL = process.env.SITE_URL ?? 'https://dondeta.jfmcss.com'
