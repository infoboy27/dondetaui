import type { MetadataRoute } from 'next'
import { getAllProducts, getStores } from '../lib/api'
import { SEO_CATEGORIES } from '../lib/categories'
import { SITE_URL } from '../lib/site'

// The API isn't reachable at Docker build time (it's a separate container
// that starts later), and a stale build-time snapshot would defeat the
// point of a sitemap anyway — render this per-request instead.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, stores] = await Promise.all([getAllProducts(), getStores()])

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    ...SEO_CATEGORIES.map(category => ({
      url: `${SITE_URL}/categoria/${category.id}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...stores.map(store => ({
      url: `${SITE_URL}/stores/${store.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...products.map(product => ({
      url: `${SITE_URL}/product/${product.slug}`,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
  ]
}
