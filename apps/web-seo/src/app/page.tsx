import type { Metadata } from 'next'
import { BUYING_GUIDES } from '../lib/content'
import { getAllProducts, getStores } from '../lib/api'
import { SEO_CATEGORIES, matchesCategory } from '../lib/categories'
import { formatPrice } from '../lib/format'
import { getBestOffer } from '../lib/offers'
import { Card, H1, H2, Lead, P, Shell } from '../lib/page'
import { colors, fonts } from '../lib/tokens'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'DóndeTa — compara precios de electrodomesticos en Republica Dominicana',
  description: 'Compara precios publicados de electrodomesticos, aires, neveras, estufas y televisores en tiendas de Republica Dominicana.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const [products, stores] = await Promise.all([getAllProducts(), getStores()])
  const featured = products
    .filter(product => product.prices.length > 0)
    .slice(0, 8)

  return (
    <Shell>
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, .8fr)', gap: 24, alignItems: 'start' }}>
        <div>
          <H1>Compara precios antes de comprar en Republica Dominicana</H1>
          <Lead>
            DóndeTa monitorea precios publicados de electrodomesticos y tecnologia en tiendas locales para ayudarte a decidir con mas contexto: precio actual, tienda, disponibilidad, historial y categoria.
          </Lead>
          <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '0 0 24px' }}>
            <a href="/search" style={{ background: colors.primary, color: '#fff', padding: '12px 18px', borderRadius: 12, fontFamily: fonts.display, fontWeight: 700, textDecoration: 'none' }}>Abrir comparador</a>
            <a href="/metodologia" style={{ background: colors.card, color: colors.navy, border: `1px solid ${colors.border}`, padding: '12px 18px', borderRadius: 12, fontFamily: fonts.display, fontWeight: 700, textDecoration: 'none' }}>Ver metodologia</a>
            <a href="/guias/comprar-electrodomesticos-rd" style={{ background: colors.card, color: colors.navy, border: `1px solid ${colors.border}`, padding: '12px 18px', borderRadius: 12, fontFamily: fonts.display, fontWeight: 700, textDecoration: 'none' }}>Leer guia de compra</a>
          </p>
        </div>
        <Card>
          <H2>Inventario monitoreado</H2>
          <P>{products.length} productos activos y {stores.length || 5} tiendas principales dentro del catalogo dominicano.</P>
          <P>Las paginas de producto incluyen datos estructurados, precios publicados y enlaces para verificar en la tienda original.</P>
        </Card>
      </section>

      <Card>
        <H2>Categorias principales</H2>
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
        <H2>Productos recientes con precio publicado</H2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {featured.map(product => {
            const offer = getBestOffer(product.prices)
            return (
              <a key={product.id} href={`/product/${product.slug}`} style={{ display: 'block', padding: 14, borderRadius: 12, border: `1px solid ${colors.border}`, textDecoration: 'none', background: '#fff' }}>
                <strong style={{ display: 'block', fontFamily: fonts.body, fontSize: 14, color: colors.navy }}>{product.name}</strong>
                <span style={{ display: 'block', fontFamily: fonts.body, fontSize: 12, color: colors.navy400, marginTop: 4 }}>{product.brand}</span>
                {offer && <span style={{ display: 'block', fontFamily: fonts.display, color: colors.primary, fontWeight: 800, marginTop: 8 }}>{formatPrice(offer.price)} en {offer.store}</span>}
              </a>
            )
          })}
        </div>
      </Card>

      <Card>
        <H2>Guias utiles</H2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {BUYING_GUIDES.map(guide => (
            <a key={guide.slug} href={`/guias/${guide.slug}`} style={{ display: 'block', padding: 16, borderRadius: 12, background: colors.background, textDecoration: 'none' }}>
              <strong style={{ fontFamily: fonts.display, color: colors.navy }}>{guide.title}</strong>
              <span style={{ display: 'block', marginTop: 6, fontFamily: fonts.body, color: colors.navy400, lineHeight: 1.55 }}>{guide.description}</span>
            </a>
          ))}
        </div>
      </Card>
    </Shell>
  )
}
