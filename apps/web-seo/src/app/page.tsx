import type { Metadata } from 'next'
import { BUYING_GUIDES } from '../lib/content'
import { getAllProducts, getStores } from '../lib/api'
import { SEO_CATEGORIES, matchesCategory } from '../lib/categories'
import { formatPrice } from '../lib/format'
import { analyzeHistory, isThinProduct } from '../lib/history'
import { getBestOffer } from '../lib/offers'
import { Card, H1, H2, Lead, P, Shell } from '../lib/page'
import { colors, fonts } from '../lib/tokens'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'DóndeTa — precios e historial de electrodomésticos en República Dominicana',
  description:
    'DóndeTa registra los precios publicados de electrodomésticos, aires, neveras, lavadoras y televisores en tiendas dominicanas y muestra su historial para darte contexto antes de comprar.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const [products, stores] = await Promise.all([getAllProducts(), getStores()])

  const withHistory = products.filter(
    p => p.prices.length > 0 && analyzeHistory(p.priceHistory, getBestOffer(p.prices)?.price),
  )
  const indexable = withHistory.filter(
    p => !isThinProduct(new Set(p.prices.map(o => o.store)).size, p.priceHistory),
  )
  const featured = (indexable.length >= 6 ? indexable : withHistory).slice(0, 8)

  return (
    <Shell>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .8fr)', gap: 24, alignItems: 'start' }}>
        <div>
          <H1>Precios e historial de electrodomésticos en República Dominicana</H1>
          <Lead>
            DóndeTa revisa periódicamente el precio publicado de electrodomésticos y tecnología en tiendas dominicanas y
            guarda cómo cambia en el tiempo. En cada ficha ves el precio actual, la tienda, su mínimo y su máximo
            registrados, y cuánto se ha movido, para decidir con más contexto.
          </Lead>
          <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '0 0 24px' }}>
            <a href="/search" style={{ background: colors.primary, color: '#fff', padding: '12px 18px', borderRadius: 12, fontFamily: fonts.display, fontWeight: 700, textDecoration: 'none' }}>Abrir comparador</a>
            <a href="/guias" style={{ background: colors.card, color: colors.navy, border: `1px solid ${colors.border}`, padding: '12px 18px', borderRadius: 12, fontFamily: fonts.display, fontWeight: 700, textDecoration: 'none' }}>Guías de compra</a>
            <a href="/metodologia" style={{ background: colors.card, color: colors.navy, border: `1px solid ${colors.border}`, padding: '12px 18px', borderRadius: 12, fontFamily: fonts.display, fontWeight: 700, textDecoration: 'none' }}>Ver metodología</a>
          </p>
        </div>
        <Card>
          <H2>Qué monitoreamos</H2>
          <P>
            {products.length} productos con precio publicado en {stores.length || 5} tiendas dominicanas. Hoy la mayoría
            tiene una sola tienda por producto, así que el valor principal está en el historial de cada precio, no en la
            comparación entre comercios.
          </P>
          <P>Las fichas incluyen datos estructurados, historial de precio y enlace para verificar en la tienda original.</P>
        </Card>
      </section>

      <Card>
        <H2>Categorías</H2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {SEO_CATEGORIES.map(category => {
            const count = products.filter(product => matchesCategory(product, category.id)).length
            return (
              <a key={category.id} href={`/categoria/${category.id}`} style={{ display: 'block', padding: 16, borderRadius: 12, background: colors.background, textDecoration: 'none' }}>
                <strong style={{ fontFamily: fonts.display, color: colors.navy }}>{category.label}</strong>
                <span style={{ display: 'block', marginTop: 4, fontFamily: fonts.body, color: colors.navy400, fontSize: 13 }}>{count} productos monitoreados</span>
              </a>
            )
          })}
        </div>
      </Card>

      <Card>
        <H2>Productos con historial de precio</H2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {featured.map(product => {
            const offer = getBestOffer(product.prices)
            const stats = analyzeHistory(product.priceHistory, offer?.price)
            return (
              <a key={product.id} href={`/product/${product.slug}`} style={{ display: 'block', padding: 14, borderRadius: 12, border: `1px solid ${colors.border}`, textDecoration: 'none', background: '#fff' }}>
                <strong style={{ display: 'block', fontFamily: fonts.body, fontSize: 14, color: colors.navy }}>{product.name}</strong>
                <span style={{ display: 'block', fontFamily: fonts.body, fontSize: 12, color: colors.navy400, marginTop: 4 }}>{product.brand}</span>
                {offer && <span style={{ display: 'block', fontFamily: fonts.display, color: colors.primary, fontWeight: 800, marginTop: 8 }}>{formatPrice(offer.price)} en {offer.store}</span>}
                {stats && (
                  <span style={{ display: 'block', fontFamily: fonts.body, fontSize: 11, color: colors.navy400, marginTop: 4 }}>
                    {stats.isAtLowest ? 'En su precio más bajo registrado' : `${stats.pctAboveMin}% sobre su mínimo · ${stats.count} mediciones`}
                  </span>
                )}
              </a>
            )
          })}
        </div>
      </Card>

      <Card>
        <H2>Guías de compra</H2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {BUYING_GUIDES.slice(0, 6).map(guide => (
            <a key={guide.slug} href={`/guias/${guide.slug}`} style={{ display: 'block', padding: 16, borderRadius: 12, background: colors.background, textDecoration: 'none' }}>
              <strong style={{ fontFamily: fonts.display, color: colors.navy }}>{guide.title}</strong>
              <span style={{ display: 'block', marginTop: 6, fontFamily: fonts.body, color: colors.navy400, lineHeight: 1.55, fontSize: 13 }}>{guide.description}</span>
            </a>
          ))}
        </div>
        <p style={{ margin: '14px 0 0' }}>
          <a href="/guias" style={{ color: colors.primary, fontFamily: fonts.body, fontWeight: 700, fontSize: 14 }}>Ver todas las guías →</a>
        </p>
      </Card>
    </Shell>
  )
}
