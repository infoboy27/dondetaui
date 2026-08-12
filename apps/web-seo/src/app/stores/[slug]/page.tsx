import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStoreBySlug, getStoreProducts } from '../../../lib/api'
import { formatPrice } from '../../../lib/format'
import { getBestOffer } from '../../../lib/offers'
import { colors, fonts } from '../../../lib/tokens'
import { SITE_URL } from '../../../lib/site'

interface Props {
  params: Promise<{ slug: string }>
}

// Server-rendered so a store's product list is real, crawlable HTML (a
// fresh hit, crawler, or shared link -- in-app navigation to /stores/:abbr
// is the SPA's own client-side route, using the retailer's short abbr
// instead of its slug, and never reaches this page; see the comment on
// SITE_URL's sibling product page for the same split).
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) return {}

  const title = `${store.name} — Compara precios | DóndeTa`
  const description = `Compara los precios de ${store.productCount} productos en ${store.name} contra otras tiendas de República Dominicana.`

  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/stores/${store.slug}` },
  }
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  if (!store) notFound()

  const products = await getStoreProducts(slug)

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 64px' }}>
      <a href={SITE_URL} style={{ fontSize: 13, color: colors.navy400, fontFamily: fonts.body, textDecoration: 'none' }}>
        ← DóndeTa
      </a>

      <h1 style={{ fontFamily: fonts.display, fontSize: 26, color: colors.navy, margin: '16px 0 4px' }}>
        {store.name}
      </h1>
      <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.navy400, margin: '0 0 24px' }}>
        {products.length} producto{products.length === 1 ? '' : 's'} comparados en DóndeTa
      </p>

      {products.length === 0 && (
        <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.navy400 }}>
          Todavía no tenemos productos de {store.name} en el catálogo.
        </p>
      )}

      {products.map(product => {
        const offer = product.prices.find(p => p.store === store.name) ?? getBestOffer(product.prices)
        return (
          <a
            key={product.id}
            href={`/product/${product.slug}`}
            style={{
              display: 'flex', gap: 14, alignItems: 'center',
              padding: '14px 16px', marginBottom: 10,
              background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14,
              textDecoration: 'none',
            }}
          >
            {product.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                width={56}
                height={56}
                style={{ borderRadius: 10, objectFit: 'cover', background: colors.background, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.name}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy400 }}>{product.brand}</div>
            </div>
            {offer && (
              <div style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 700, color: colors.primary, flexShrink: 0 }}>
                {formatPrice(offer.price)}
              </div>
            )}
          </a>
        )
      })}
    </main>
  )
}
