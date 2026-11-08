// "¿Y en Amazon?" on product pages: an Amazon Associates search link for the
// same product, so shoppers who import by courier can compare the total.
// Pure (env passed in) so it can be unit-tested; site.ts reads the real env.
// Hidden until AMAZON_TAG is set for the stack (Amazon Associates tracking id).

type Env = Record<string, string | undefined>

export interface AmazonConfig {
  tag: string
  domain: string
}

export function amazonConfig(env: Env): AmazonConfig | null {
  const tag = env.AMAZON_TAG?.trim()
  if (!tag) return null
  const domain = env.AMAZON_DOMAIN?.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'www.amazon.com'
  return { tag, domain }
}

// Brand + name, without repeating the brand when the name already has it.
export function amazonQuery(product: { name: string; brand: string }): string {
  const name = product.name.trim()
  const brand = product.brand.trim()
  if (!brand || name.toLowerCase().includes(brand.toLowerCase())) return name
  return `${brand} ${name}`
}

// Gaming codes are sold through Eneba (its own affiliate deal): no Amazon card there.
export function amazonSearchUrl(product: { name: string; brand: string; categoryId: string }, config: AmazonConfig | null): string | null {
  if (!config || product.categoryId === 'gaming') return null
  const query = amazonQuery(product)
  if (!query) return null
  return `https://${config.domain}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(config.tag)}`
}
