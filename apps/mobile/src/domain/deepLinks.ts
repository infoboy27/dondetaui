// Universal links (iOS) / App Links (Android): https://dondeta.com.do/... opens
// the app. The web and the app share most paths; this maps the few that
// differ to app routes. Used by app/+native-intent.tsx. Pure, tested.

const STORE_WEB = /^\/stores\/([a-z0-9-]+)\/?$/i
const PRODUCT = /^\/product\/([^/?#]+)\/?$/
const STORE_APP = /^\/store\/([a-z0-9-]+)\/?$/i

// Returns the app path for an incoming link, or "/" when the app has no
// matching screen (the web keeps working in the browser for those).
export function appPathFor(incoming: string): string {
  let path = incoming
  let query = ''
  try {
    // Full URLs (https://dondeta.com.do/x, dondeta://x) and bare paths.
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(incoming)) {
      const url = new URL(incoming)
      path = url.protocol === 'https:' || url.protocol === 'http:' ? url.pathname : `/${url.host}${url.pathname}`
      query = url.search
    } else {
      const q = incoming.indexOf('?')
      if (q >= 0) {
        path = incoming.slice(0, q)
        query = incoming.slice(q)
      }
    }
  } catch {
    return '/'
  }
  path = path.replace(/\/{2,}/g, '/') || '/'

  const store = STORE_WEB.exec(path) ?? STORE_APP.exec(path)
  if (store) return `/store/${store[1]!.toLowerCase()}`
  const product = PRODUCT.exec(path)
  if (product) return `/product/${product[1]}`
  if (/^\/cuenta\/black-friday\/?$/.test(path)) {
    const activate = new URLSearchParams(query).get('activar') === '1'
    return activate ? '/black-friday-alerts?activar=1' : '/black-friday-alerts'
  }
  // Paths the app already has (tabs, gaming, nearby stores…) pass through.
  if (/^\/(search|scanner|alerts|profile|gaming|nearby-stores|country)\/?$/.test(path)) return path
  return '/'
}
