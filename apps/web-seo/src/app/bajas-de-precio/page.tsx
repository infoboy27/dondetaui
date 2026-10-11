import type { Metadata } from 'next'
import { getAllProducts } from '../../lib/api'
import { monthYear, topDrops } from '../../lib/insights'
import { SiteFooter, SiteHeader } from '../../lib/page'
import { Breadcrumb, DropList, Section, h1Style, leadStyle, pageMain } from '../../lib/seoBlocks'
import { COUNTRY_NAME, SITE_URL } from '../../lib/site'
import { colors } from '../../lib/tokens'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const title = `Bajas de precio en electrodomésticos — ${COUNTRY_NAME} (${monthYear()}) | DóndeTa`
  const description = `Los electrodomésticos que bajaron de precio en tiendas de ${COUNTRY_NAME}, según el historial de precios de DóndeTa.`
  return { title, description, openGraph: { title, description }, alternates: { canonical: '/bajas-de-precio' } }
}

export default async function PriceDropsPage() {
  const drops = topDrops(await getAllProducts(), 40)

  return (
    <main style={pageMain}>
      <SiteHeader />
      <Breadcrumb items={[{ href: SITE_URL, label: 'DóndeTa' }, { href: '/precios', label: 'Precios' }, { label: 'Bajas de precio' }]} />
      <h1 style={h1Style}>Bajaron de precio</h1>
      <p style={leadStyle}>
        Electrodomésticos cuyo precio publicado bajó en su última actualización, según el historial que DóndeTa registra en las tiendas
        de {COUNTRY_NAME}. Ordenados por porcentaje de baja. ¿Buscas ofertas de temporada? Mira{' '}
        <a href="/black-friday" style={{ color: colors.primary }}>cuáles son reales en Black Friday</a>.
      </p>
      {drops.length ? (
        <Section title={`${drops.length} bajas de precio`}>
          <DropList items={drops} />
        </Section>
      ) : (
        <p style={leadStyle}>Hoy no registramos bajas de precio. Vuelve mañana.</p>
      )}
      <SiteFooter />
    </main>
  )
}
