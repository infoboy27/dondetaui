import type { Metadata } from 'next'
import { getAllProducts } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import { monthYear, topComparisons } from '../../lib/insights'
import { SiteFooter, SiteHeader } from '../../lib/page'
import { Breadcrumb, ComparisonList, Section, h1Style, leadStyle, pageMain } from '../../lib/seoBlocks'
import { COUNTRY_NAME, SITE_URL } from '../../lib/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const title = `Mismo producto, distinto precio: los mayores ahorros en ${COUNTRY_NAME} (${monthYear()}) | DóndeTa`
  const description = `Los electrodomésticos con la mayor diferencia de precio entre tiendas de ${COUNTRY_NAME} hoy. Compara antes de comprar.`
  return { title, description, openGraph: { title, description }, alternates: { canonical: '/comparaciones' } }
}

export default async function ComparisonsPage() {
  const comparisons = topComparisons(await getAllProducts(), 30)
  const total = comparisons.reduce((sum, c) => sum + c.savings, 0)

  return (
    <main style={pageMain}>
      <SiteHeader />
      <Breadcrumb items={[{ href: SITE_URL, label: 'DóndeTa' }, { href: '/precios', label: 'Precios' }, { label: 'Comparaciones' }]} />
      <h1 style={h1Style}>El mismo producto, más barato en otra tienda</h1>
      <p style={leadStyle}>
        Estos son los electrodomésticos con la mayor diferencia de precio entre tiendas de {COUNTRY_NAME} hoy.
        {comparisons[0] && (
          <> El caso más grande: <b>{comparisons[0].product.name}</b> cuesta <b>{formatPrice(comparisons[0].savings)}</b> menos en {comparisons[0].cheapest} que en {comparisons[0].priciest}.</>
        )}
        {total > 0 && <> Sumando los {comparisons.length} productos de esta lista, comparar ahorra <b>{formatPrice(total)}</b>.</>}
      </p>
      <Section title="Mayores ahorros de hoy" subtitle="Precio más bajo y cuánto te ahorras frente a la tienda más cara">
        <ComparisonList items={comparisons} />
      </Section>
      <SiteFooter />
    </main>
  )
}
