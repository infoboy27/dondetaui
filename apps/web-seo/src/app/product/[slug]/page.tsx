import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, getProductReviews } from '../../../lib/api'
import { formatPrice } from '../../../lib/format'
import { getBestOffer, rankOffers } from '../../../lib/offers'
import { colors, fonts } from '../../../lib/tokens'
import { SITE_URL } from '../../../lib/site'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  const bestOffer = getBestOffer(product.prices)
  const title = `${product.name} — ${bestOffer ? formatPrice(bestOffer.price) : 'Comparar precios'} | DóndeTa`
  const description = `Compara el precio de ${product.name} entre ${product.prices.length} tienda${product.prices.length === 1 ? '' : 's'} en República Dominicana.`

  return {
    title,
    description,
    openGraph: { title, description, images: product.image ? [product.image] : undefined },
    alternates: { canonical: `/product/${product.slug}` },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [reviews, offers] = await Promise.all([
    getProductReviews(product.id),
    Promise.resolve(rankOffers(product.prices)),
  ])
  const bestOffer = offers[0]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    image: product.image || undefined,
    description: product.subtitle,
    ...(reviews.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviews.average.toFixed(1),
        reviewCount: reviews.count,
      },
    }),
    offers: offers.map(offer => ({
      '@type': 'Offer',
      price: offer.price,
      priceCurrency: 'DOP',
      availability: offer.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: offer.store },
      ...(offer.url && { url: offer.url }),
    })),
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 64px' }}>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <a href={SITE_URL} style={{ fontSize: 13, color: colors.navy400, fontFamily: fonts.body, textDecoration: 'none' }}>
        ← DóndeTa
      </a>

      <div style={{ display: 'flex', gap: 20, margin: '20px 0', flexWrap: 'wrap' }}>
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            width={220}
            height={220}
            style={{ borderRadius: 16, objectFit: 'cover', background: colors.card }}
          />
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 12, color: colors.navy400, fontFamily: fonts.body, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {product.brand} · {product.model}
          </div>
          <h1 style={{ fontFamily: fonts.display, fontSize: 24, color: colors.navy, margin: '4px 0 8px' }}>
            {product.name}
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: colors.navy400, margin: '0 0 12px' }}>
            {product.subtitle}
          </p>
          {reviews.count > 0 && (
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy, margin: '0 0 12px' }}>
              ★ {reviews.average.toFixed(1)} ({reviews.count} opinion{reviews.count === 1 ? '' : 'es'})
            </p>
          )}
          {bestOffer && (
            <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 700, color: colors.primary }}>
              {formatPrice(bestOffer.price)}
              <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 400, color: colors.navy400 }}>
                {' '}en {bestOffer.store}
              </span>
            </div>
          )}
        </div>
      </div>

      <section style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.navy, margin: 0, padding: '14px 16px', borderBottom: `1px solid ${colors.border}` }}>
          Comparación de precios ({offers.length} tienda{offers.length === 1 ? '' : 's'})
        </h2>
        {offers.map((offer, i) => (
          <div
            key={`${offer.store}-${i}`}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < offers.length - 1 ? `1px solid ${colors.border}` : 'none',
              background: i === 0 ? colors.primaryLight : 'transparent',
            }}
          >
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.navy }}>
                {offer.store} {i === 0 && <span style={{ color: colors.primary, fontSize: 11 }}>· más barato</span>}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy400 }}>
                {offer.available ? 'Disponible' : 'No disponible'} · Envío {offer.shipping}
              </div>
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 700, color: colors.navy }}>
              {formatPrice(offer.price)}
            </div>
          </div>
        ))}
      </section>

      {reviews.reviews.length > 0 && (
        <section style={{ marginTop: 20, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '14px 16px' }}>
          <h2 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.navy, margin: '0 0 12px' }}>
            Reseñas
          </h2>
          {reviews.reviews.map(review => (
            <div key={review.id} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 600, color: colors.navy }}>
                {review.userName} · {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
              {review.comment && (
                <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400, margin: '4px 0 0' }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      <p style={{ marginTop: 24, fontFamily: fonts.body, fontSize: 12, color: colors.navy200 }}>
        Precios actualizados regularmente. Verifica disponibilidad en tienda.
      </p>
    </main>
  )
}
