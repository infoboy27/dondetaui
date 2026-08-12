import type { MetadataRoute } from 'next'
import { getAllProducts } from '../lib/api'
import { SITE_URL } from '../lib/site'

// The API isn't reachable at Docker build time (it's a separate container
// that starts later), and a stale build-time snapshot would defeat the
// point of a sitemap anyway — render this per-request instead.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts()

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...products.map(product => ({
      url: `${SITE_URL}/product/${product.slug}`,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
  ]
}
