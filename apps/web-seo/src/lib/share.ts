// "Compartir por WhatsApp": the link and message a shopper sends. Mirrors
// src/domain/share.ts (SPA) and apps/mobile/src/domain/share.ts, duplicated
// for the same reason as tokens.ts. Pure functions.

/**
 * Where the share started, as utm_source. "whatsapp" is the wa.me button;
 * the system share sheets (navigator.share, the app's Share) can end in any
 * app, so they get their own source instead of claiming WhatsApp.
 */
export type ShareSource = 'whatsapp' | 'web_share' | 'app'

const MAX_NAME = 80

export function shortName(name: string, max = MAX_NAME): string {
  const clean = name.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

/** Product page with the share UTMs (each source shows up in /admin → Campañas). */
export function productShareUrl(siteUrl: string, slug: string, source: ShareSource): string {
  const params = new URLSearchParams({ utm_source: source, utm_medium: 'share', utm_campaign: 'producto' })
  return `${siteUrl.replace(/\/+$/, '')}/product/${encodeURIComponent(slug)}?${params}`
}

/** The text above the link. `price` comes already formatted (RD$24,495). */
export function shareMessage(name: string, best?: { price: string; store: string }): string {
  const lead = best ? `${shortName(name)} a ${best.price} en ${best.store} 👀` : `${shortName(name)} 👀`
  return `${lead}\n¿Dónde 'ta más barato? Míralo en DóndeTa:`
}

/** wa.me opens WhatsApp (app or web) with the message ready to send. */
export function whatsappShareHref(message: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`
}
