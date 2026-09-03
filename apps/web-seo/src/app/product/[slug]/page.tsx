import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, getProductReviews } from '../../../lib/api'
import { SEO_CATEGORIES, matchesCategory } from '../../../lib/categories'
import { formatPrice } from '../../../lib/format'
import { analyzeHistory, formatDateEs, isThinProduct } from '../../../lib/history'
import { rankOffers } from '../../../lib/offers'
import { colors, fonts } from '../../../lib/tokens'
import { SITE_URL } from '../../../lib/site'
import { PriceHistoryCard } from '../../../components/PriceHistoryCard'
import type { Product } from '../../../lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

// jsonLd embeds retailer-scraped fields (product name, offer store/url) that
// aren't fully trusted -- JSON.stringify alone doesn't escape `<`, so a
// value containing a literal `</script>` could close this tag early and
// inject arbitrary HTML. < is a valid JSON escape for `<` and decodes
// back to the same character once parsed, so this is a no-op for legitimate
// content and only neutralizes the breakout string.
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

function seoCategoryFor(product: Product) {
  return SEO_CATEGORIES.find(c => matchesCategory(product, c.id))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}

  const offers = rankOffers(product.prices)
  const storeCount = new Set(offers.map(o => o.store)).size
  const best = offers[0]
  const thin = isThinProduct(storeCount, product.priceHistory)

  const title = `${product.name} — ${best ? formatPrice(best.price) : 'Precio y historial'} | DóndeTa`
  const description = best
    ? storeCount >= 2
      ? `Compara el precio de ${product.name} entre ${storeCount} tiendas en República Dominicana. Precio más bajo: ${formatPrice(best.price)} en ${best.store}. Historial de precios y enlaces para verificar.`
      : `${product.name} en ${best.store}: ${formatPrice(best.price)}. Historial de precios publicados, ficha básica y enlace para verificar en la tienda. República Dominicana.`
    : `Ficha e historial de precio de ${product.name} en República Dominicana.`

  return {
    title,
    description,
    openGraph: { title, description, images: product.image ? [product.image] : undefined },
    alternates: { canonical: `/product/${product.slug}` },
    // Single-retailer pages with little history add little on their own --
    // keep them crawlable (follow) but out of the index so the site isn't
    // judged on hundreds of near-empty pages.
    ...(thin && { robots: { index: false, follow: true } }),
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
  const storeCount = new Set(offers.map(offer => offer.store)).size
  const category = seoCategoryFor(product)
  const historyStats = analyzeHistory(product.priceHistory, bestOffer?.price)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    ...(product.model && { model: product.model }),
    image: product.image || undefined,
    description: product.subtitle || product.name,
    ...(reviews.count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviews.average.toFixed(1),
        reviewCount: reviews.count,
      },
    }),
    offers:
      offers.length > 1
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'DOP',
            lowPrice: Math.min(...offers.map(o => o.price)),
            highPrice: Math.max(...offers.map(o => o.price)),
            offerCount: offers.length,
          }
        : offers.map(offer => ({
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

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'DóndeTa', item: SITE_URL },
      ...(category
        ? [{ '@type': 'ListItem', position: 2, name: category.label, item: `${SITE_URL}/categoria/${category.id}` }]
        : []),
      {
        '@type': 'ListItem',
        position: category ? 3 : 2,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 64px' }}>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      <nav style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400 }}>
        <a href={SITE_URL} style={{ color: colors.navy400, textDecoration: 'none' }}>DóndeTa</a>
        {category && (
          <>
            {' / '}
            <a href={`/categoria/${category.id}`} style={{ color: colors.navy400, textDecoration: 'none' }}>
              {category.label}
            </a>
          </>
        )}
      </nav>

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
            <>
              <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 700, color: colors.primary }}>
                {formatPrice(bestOffer.price)}
                <span style={{ fontFamily: fonts.body, fontSize: 13, fontWeight: 400, color: colors.navy400 }}>
                  {' '}en {bestOffer.store}
                </span>
              </div>
              {bestOffer.url && (
                <a
                  href={bestOffer.url}
                  rel="nofollow noopener"
                  target="_blank"
                  style={{ display: 'inline-block', marginTop: 12, background: colors.primary, color: '#fff', padding: '10px 16px', borderRadius: 10, fontFamily: fonts.display, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                >
                  Ver en {bestOffer.store}
                </a>
              )}
            </>
          )}
        </div>
      </div>

      <section style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.navy, margin: 0, padding: '14px 16px', borderBottom: `1px solid ${colors.border}` }}>
          {storeCount >= 2 ? `Comparación de precios (${storeCount} tiendas)` : 'Precio publicado'}
        </h2>
        {offers.map((offer, i) => (
          <div
            key={`${offer.store}-${i}`}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px',
              borderBottom: i < offers.length - 1 ? `1px solid ${colors.border}` : 'none',
              background: i === 0 && offers.length > 1 ? colors.primaryLight : 'transparent',
            }}
          >
            <div>
              <div style={{ fontFamily: fonts.body, fontSize: 14, fontWeight: 600, color: colors.navy }}>
                {offer.store}{' '}
                {i === 0 && offers.length > 1 && <span style={{ color: colors.primary, fontSize: 11 }}>· más barato</span>}
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

      <PriceHistoryCard
        history={product.priceHistory}
        currentPrice={bestOffer?.price ?? 0}
        name={product.name}
        store={bestOffer?.store ?? 'la tienda'}
      />

      <section style={{ marginTop: 20, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16 }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 15, color: colors.navy, margin: '0 0 10px' }}>
          Cómo usar esta página
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400, margin: '0 0 10px' }}>
          {storeCount >= 2
            ? `${product.name} tiene precio publicado en ${storeCount} tiendas. Ordenamos primero las ofertas disponibles y luego por costo total estimado, así que el primer resultado no siempre es el de menor precio de lista.`
            : `Hoy solo ${bestOffer?.store ?? 'una tienda'} publica precio para ${product.name}, así que esta página funciona como registro histórico y punto de verificación más que como comparación entre tiendas.`}
          {historyStats
            ? ` La primera medición es del ${formatDateEs(historyStats.firstDate)} y la última del ${formatDateEs(historyStats.lastDate)}.`
            : ''}
        </p>
        <p style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400, margin: 0 }}>
          Antes de comprar, confirma precio final, envío, garantía e instalación con la tienda. Lee la{' '}
          <a href="/metodologia" style={{ color: colors.primary }}>metodología de DóndeTa</a> para entender cómo
          recopilamos los datos y qué limitaciones tienen.
        </p>
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
        Precios actualizados regularmente. Verifica disponibilidad en tienda. Para compras grandes, revisa también la
        guía para{' '}
        <a href="/guias/comprar-electrodomesticos-rd" style={{ color: colors.primary }}>
          comparar electrodomésticos en RD
        </a>
        .
      </p>
    </main>
  )
}
