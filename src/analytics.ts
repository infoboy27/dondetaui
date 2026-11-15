import type { Product, StorePrice } from './types'

// GA4 events for the conversion funnel: search -> view_item -> click_offer
// (the visit DóndeTa sends to a store, the number it sells), plus the
// engagement steps (favorites, alerts, accounts). gtag is a no-op until the
// deferred gtag.js loads; dataLayer queues the calls meanwhile.
export function track(event: string, params: Record<string, unknown> = {}) {
  window.gtag?.('event', event, params)
}

function item(product: Pick<Product, 'id' | 'name' | 'brand' | 'category'>, offer?: StorePrice) {
  return {
    item_id: product.id,
    item_name: product.name,
    item_brand: product.brand,
    item_category: product.category,
    ...(offer ? { affiliation: offer.store, price: offer.price } : {}),
  }
}

export function trackSearch(term: string) {
  if (term.trim()) track('search', { search_term: term.trim() })
}

export function trackViewItem(product: Product) {
  track('view_item', { currency: 'DOP', items: [item(product)] })
}

// Fired right before opening the store's page through /api/go.
export function trackOfferClick(product: Product, offer: StorePrice, placement: string) {
  track('click_offer', {
    store: offer.store,
    placement,
    value: offer.price,
    currency: 'DOP',
    items: [item(product, offer)],
  })
}

export function trackFavorite(productId: string) {
  track('add_to_wishlist', { items: [{ item_id: productId }] })
}

export function trackAlert(productId: string) {
  track('create_alert', { items: [{ item_id: productId }] })
}

export function trackAuth(kind: 'login' | 'sign_up') {
  track(kind, { method: 'email' })
}

// GA4's recommended "share" event; the shared link also carries
// utm_source=<method>&utm_medium=share, so the visits it brings show up as
// their own row in /admin → Campañas.
export function trackShare(productId: string, method: 'whatsapp' | 'web_share') {
  track('share', { method, content_type: 'product', item_id: productId })
}
