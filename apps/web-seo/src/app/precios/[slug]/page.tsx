import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProducts } from '../../../lib/api'
import { formatPrice } from '../../../lib/format'
import { PRODUCT_TYPES, bestPrice, matchesType, monthYear, topComparisons, topDrops, typeStats } from '../../../lib/insights'
import { SiteFooter, SiteHeader } from '../../../lib/page'
import { Breadcrumb, ComparisonList, DropList, FaqBlock, ProductList, Section, h1Style, leadStyle, pageMain, type Faq } from '../../../lib/seoBlocks'
import { COUNTRY_NAME, SITE_URL } from '../../../lib/site'
import { colors, fonts } from '../../../lib/tokens'

interface Props {
  params: Promise<{ slug: string }>
}

// Rendered per request from the live catalog (prices change daily); the API
// fetch itself is cached 5 minutes (lib/api.ts).
export const dynamic = 'force-dynamic'

const MIN_PRODUCTS = 3 // fewer than this is a thin page: noindex

async function load(slug: string) {
  const type = PRODUCT_TYPES.find(t => t.slug === slug)
  if (!type) return null
  const products = (await getAllProducts()).filter(p => matchesType(p, type))
  return { type, products, stats: typeStats(products) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await load(slug)
  if (!data) return {}
  const { type, stats } = data
  const title = `Precios de ${type.label} en ${COUNTRY_NAME} (${monthYear()}) | DóndeTa`
  const description = stats
    ? `Compara ${stats.count} ${type.label} en ${stats.stores} tiendas: desde ${formatPrice(stats.min)}. Dónde está más barato hoy, bajas de precio e historial.`
    : `Precios de ${type.label} en tiendas de ${COUNTRY_NAME}.`
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/precios/${type.slug}` },
    ...((stats?.count ?? 0) < MIN_PRODUCTS && { robots: { index: false, follow: true } }),
  }
}

export default async function PricesByTypePage({ params }: Props) {
  const { slug } = await params
  const data = await load(slug)
  if (!data) notFound()
  const { type, products, stats } = data

  const comparisons = topComparisons(products, 8)
  const drops = topDrops(products, 6)
  const cheapest = [...products].sort((a, b) => (bestPrice(a) ?? 0) - (bestPrice(b) ?? 0)).slice(0, 20)
  const month = monthYear()

  const faqs: Faq[] = []
  if (stats && cheapest[0]) {
    faqs.push({
      q: `¿Cuál es la ${type.label.replace(/s$/, '')} más barata en ${COUNTRY_NAME}?`,
      a: `Hoy, la opción más económica que registramos es ${cheapest[0].name}, desde ${formatPrice(stats.min)}. El precio típico (mediana) de las ${stats.count} ${type.label} que monitoreamos es ${formatPrice(stats.median)}.`,
    })
  }
  if (stats?.cheapestStore) {
    faqs.push({
      q: `¿Qué tienda tiene las ${type.label} más baratas?`,
      a: `De los ${stats.compared} modelos que se venden en más de una tienda, ${stats.cheapestStore.name} tiene el precio más bajo en el ${stats.cheapestStore.share}% de los casos. Varía por modelo, así que conviene comparar el modelo exacto.`,
    })
  }
  if (comparisons[0]) {
    faqs.push({
      q: `¿Cuánto se puede ahorrar comparando ${type.label}?`,
      a: `En ${comparisons[0].product.name} la diferencia entre la tienda más barata (${comparisons[0].cheapest}) y la más cara (${comparisons[0].priciest}) es de ${formatPrice(comparisons[0].savings)}.`,
    })
  }
  faqs.push({
    q: '¿Cada cuánto se actualizan estos precios?',
    a: 'DóndeTa revisa los precios publicados en las tiendas varias veces al día. Antes de comprar, confirma precio final, envío e instalación con la tienda.',
  })

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${type.title} más baratos en ${COUNTRY_NAME}`,
    itemListElement: cheapest.slice(0, 10).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/product/${product.slug}`,
      name: product.name,
    })),
  }

  return (
    <main style={pageMain}>
      <SiteHeader />
      <Breadcrumb items={[{ href: SITE_URL, label: 'DóndeTa' }, { href: '/precios', label: 'Precios' }, { label: type.title }]} />
      <h1 style={h1Style}>Precios de {type.label} en {COUNTRY_NAME} — {month}</h1>

      {stats ? (
        <>
          <p style={leadStyle}>
            Monitoreamos <b>{stats.count} {type.label}</b> en <b>{stats.stores} tiendas</b>. Hoy los precios van desde{' '}
            <b>{formatPrice(stats.min)}</b> hasta <b>{formatPrice(stats.max)}</b>, con un precio típico de <b>{formatPrice(stats.median)}</b>.
            {stats.cheapestStore && (
              <> Entre los modelos que venden varias tiendas, <b>{stats.cheapestStore.name}</b> es la más barata en el {stats.cheapestStore.share}% de los casos.</>
            )}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, margin: '16px 0 4px' }}>
            {[
              ['Modelos', String(stats.count)],
              ['Desde', formatPrice(stats.min)],
              ['Precio típico', formatPrice(stats.median)],
              ['Comparados en 2+ tiendas', String(stats.compared)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.navy400 }}>{label}</div>
                <div style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 700, color: colors.navy }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={leadStyle}>Todavía no tenemos {type.label} en el catálogo. Vuelve pronto.</p>
      )}

      {comparisons.length > 0 && (
        <Section title={`Dónde están más baratas hoy`} subtitle="El mismo modelo en varias tiendas, ordenado por cuánto te ahorras">
          <ComparisonList items={comparisons} />
        </Section>
      )}

      {drops.length > 0 && (
        <Section title="Bajaron de precio" subtitle="Según nuestro historial de precios">
          <DropList items={drops} />
        </Section>
      )}

      {cheapest.length > 0 && (
        <Section title={`Las ${Math.min(20, cheapest.length)} ${type.label} más baratas`} subtitle="Precio más bajo publicado hoy, entre todas las tiendas">
          <ProductList products={cheapest} />
        </Section>
      )}

      <FaqBlock items={faqs} />

      <p style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400 }}>
        ¿Cómo elegir? Lee nuestras <a href="/guias" style={{ color: colors.primary }}>guías de compra</a> y la{' '}
        <a href="/metodologia" style={{ color: colors.primary }}>metodología</a> con la que recopilamos los precios.
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, '\\u003c') }} />
      <SiteFooter />
    </main>
  )
}
