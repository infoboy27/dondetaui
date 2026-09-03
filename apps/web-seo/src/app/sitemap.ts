import type { MetadataRoute } from 'next'
import { getAllProducts, getStores } from '../lib/api'
import { SEO_CATEGORIES } from '../lib/categories'
import { BUYING_GUIDES } from '../lib/content'
import { isThinProduct } from '../lib/history'
import { SITE_URL } from '../lib/site'

// The API isn't reachable at Docker build time (it's a separate container
// that starts later), and a stale build-time snapshot would defeat the
// point of a sitemap anyway — render this per-request instead.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, stores] = await Promise.all([getAllProducts(), getStores()])

  // Single-retailer products with little price history carry `noindex`
  // (see the product page's generateMetadata) — keeping them in the sitemap
  // would just send Google to pages we've told it not to index.
  const indexableProducts = products.filter(
    product => !isThinProduct(new Set(product.prices.map(o => o.store)).size, product.priceHistory),
  )

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/guias`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/metodologia`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/sobre-dondeta`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/terminos`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.5 },
    ...BUYING_GUIDES.map(guide => ({
      url: `${SITE_URL}/guias/${guide.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...SEO_CATEGORIES.map(category => ({
      url: `${SITE_URL}/categoria/${category.id}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...stores.map(store => ({
      url: `${SITE_URL}/stores/${store.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...indexableProducts.map(product => ({
      url: `${SITE_URL}/product/${product.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]
}
