import type { Metadata } from 'next'
import { getAllProducts } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import { PRODUCT_TYPES, matchesType, monthYear, typeStats } from '../../lib/insights'
import { SiteFooter, SiteHeader } from '../../lib/page'
import { Breadcrumb, h1Style, leadStyle, pageMain } from '../../lib/seoBlocks'
import { COUNTRY_NAME, SITE_URL } from '../../lib/site'
import { colors, fonts } from '../../lib/tokens'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const title = `Precios de electrodomésticos en ${COUNTRY_NAME} (${monthYear()}) | DóndeTa`
  const description = `Neveras, lavadoras, aires acondicionados, televisores y más: compara precios entre tiendas de ${COUNTRY_NAME}, actualizados a diario.`
  return { title, description, openGraph: { title, description }, alternates: { canonical: '/precios' } }
}

export default async function PricesIndexPage() {
  const products = await getAllProducts()
  const types = PRODUCT_TYPES
    .map(type => ({ type, stats: typeStats(products.filter(p => matchesType(p, type))) }))
    .filter(entry => entry.stats && entry.stats.count > 0)

  return (
    <main style={pageMain}>
      <SiteHeader />
      <Breadcrumb items={[{ href: SITE_URL, label: 'DóndeTa' }, { label: 'Precios' }]} />
      <h1 style={h1Style}>Precios de electrodomésticos en {COUNTRY_NAME}</h1>
      <p style={leadStyle}>
        Elige qué quieres comprar y te mostramos dónde está más barato hoy, cuánto puedes ahorrar comparando y qué bajó de precio. Datos de{' '}
        {monthYear()}, actualizados varias veces al día.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 12, marginTop: 18 }}>
        {types.map(({ type, stats }) => (
          <a key={type.slug} href={`/precios/${type.slug}`} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, textDecoration: 'none' }}>
            <div style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 700, color: colors.navy }}>{type.title}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400, marginTop: 4 }}>
              {stats!.count} modelos · desde <b style={{ color: colors.primary }}>{formatPrice(stats!.min)}</b>
            </div>
          </a>
        ))}
      </div>
      <p style={{ marginTop: 24, fontFamily: fonts.body, fontSize: 14, color: colors.navy400 }}>
        También: <a href="/comparaciones" style={{ color: colors.primary }}>mayores ahorros entre tiendas</a> ·{' '}
        <a href="/bajas-de-precio" style={{ color: colors.primary }}>bajas de precio de la semana</a>
      </p>
      <SiteFooter />
    </main>
  )
}
