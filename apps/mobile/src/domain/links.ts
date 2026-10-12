import * as WebBrowser from 'expo-web-browser'
import type { Product, StorePrice } from '../types'
import { appConfig } from '../config/env'
import { colors } from '../design/tokens'

// Where "Ver oferta" goes: through /api/go when the offer has a retailer id
// (the outbound click is recorded and affiliate params kept), else the raw URL.
export function offerUrl(product: Product, offer: StorePrice): string | null {
  if (offer.retailerId) return `${appConfig.apiBaseUrl}/go/${product.id}/${offer.retailerId}?src=app`
  return offer.url ?? null
}

// Opens a page in an in-app Safari sheet so the shopper stays in DóndeTa.
export function openInApp(url: string) {
  void WebBrowser.openBrowserAsync(url, {
    controlsColor: colors.primaryDark,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    dismissButtonStyle: 'close',
  }).catch(() => {})
}

// Public web page for a product, used when sharing. The site is the API's
// origin (each country build points at its own domain).
export function productWebUrl(product: Product): string {
  const site = appConfig.apiBaseUrl.replace(/\/api$/, '')
  return `${site}/product/${encodeURIComponent(product.slug ?? product.id)}`
}
