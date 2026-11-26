// Canonical URL and robots directive for the SPA routes. The server answers every
// SPA path with the same index.html, so without a per-route canonical Google
// reports them as "Duplicada: el usuario no ha indicado ninguna versión canónica".
// Pages rendered by web-seo (/product/*, /black-friday, /precios...) set their own.

// Signed-in, search-result and utility screens: nothing for Google to index.
const NOINDEX_PREFIXES = ['/search', '/results', '/cuenta', '/alerts', '/profile', '/login', '/scanner', '/notifications', '/admin', '/auth']

export function isNoindexPath(pathname: string): boolean {
  return NOINDEX_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/** Origin + path, without query string, hash or trailing slash (except the home page). */
export function canonicalUrl(origin: string, pathname: string): string {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  return `${origin.replace(/\/+$/, '')}${path || '/'}`
}

/** Writes <link rel="canonical"> and <meta name="robots"> for the current route. */
export function applySeoMeta(doc: Document, origin: string, pathname: string): void {
  const head = doc.head
  let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  let robots = head.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (isNoindexPath(pathname)) {
    link?.remove()
    if (!robots) {
      robots = doc.createElement('meta')
      robots.name = 'robots'
      head.appendChild(robots)
    }
    robots.content = 'noindex, follow'
    return
  }
  robots?.remove()
  if (!link) {
    link = doc.createElement('link')
    link.rel = 'canonical'
    head.appendChild(link)
  }
  link.href = canonicalUrl(origin, pathname)
}
