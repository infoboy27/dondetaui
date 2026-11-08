// "¿Y en Amazon?" in the SPA (mobile product screen and the desktop row).
// Mirrors apps/web-seo/src/lib/amazon.ts; config comes from VITE_AMAZON_TAG
// (build arg, fed from the stack's AMAZON_TAG). Hidden while the tag is empty.

export interface AmazonConfig {
  tag: string
  domain: string
}

// Amazon's required disclosure, word for word (Spanish version).
export const AMAZON_DISCLOSURE = 'Como Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.'

export function amazonConfig(tag: string | undefined, domain?: string): AmazonConfig | null {
  const cleanTag = tag?.trim()
  if (!cleanTag) return null
  const cleanDomain = domain?.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'www.amazon.com'
  return { tag: cleanTag, domain: cleanDomain }
}

export function amazonQuery(product: { name: string; brand: string }): string {
  const name = product.name.trim()
  const brand = product.brand.trim()
  if (!brand || name.toLowerCase().includes(brand.toLowerCase())) return name
  return `${brand} ${name}`
}

// Gaming codes are Eneba's (own affiliate deal): no Amazon card there.
export function amazonSearchUrl(product: { name: string; brand: string; categoryId?: string }, config: AmazonConfig | null): string | null {
  if (!config || product.categoryId === 'gaming') return null
  const query = amazonQuery(product)
  if (!query) return null
  return `https://${config.domain}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(config.tag)}`
}
