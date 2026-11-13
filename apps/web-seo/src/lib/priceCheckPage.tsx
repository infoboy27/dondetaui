import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getPriceCheck } from './api'
import { salesEvent, type SalesEventId } from './blackFriday'
import { formatPrice } from './format'
import { formatDateEs } from './history'
import { SiteFooter, SiteHeader } from './page'
import { Breadcrumb, FaqBlock, Section, h1Style, leadStyle, pageMain, type Faq } from './seoBlocks'
import { countryShortName } from './country'
import { COUNTRY, COUNTRY_NAME, CURRENCY_LOCALE, SITE_URL } from './site'
import { colors, fonts } from './tokens'
import type { PriceCheck } from './types'

// /black-friday and /cyber-monday: the same "¿la oferta es real?" check
// (prices vs their own 30-day history), each with its own date and title.

const LIMIT = 15

export function priceCheckMetadata(id: SalesEventId): Metadata {
  const ev = salesEvent(id)
  const year = ev.date.getUTCFullYear()
  const title = `${ev.name} ${year} en ${COUNTRY_NAME}: ¿la oferta es real? | DóndeTa`
  const description = `Comparamos cada precio con su historial de los últimos 30 días para decirte qué descuentos de ${ev.name} son reales y cuáles subieron antes de “bajar”.`
  return { title, description, openGraph: { title, description }, alternates: { canonical: ev.path } }
}

const badge = (background: string, color: string) =>
  ({ display: 'inline-block', fontFamily: fonts.body, fontSize: 11.5, fontWeight: 700, color, background, borderRadius: 999, padding: '2px 8px' }) as const

function CheckRow({ item, children }: { item: PriceCheck; children: ReactNode }) {
  return (
    <a
      href={`/product/${item.productSlug}`}
      style={{
        display: 'flex', gap: 14, alignItems: 'center', padding: '12px 14px', marginBottom: 8,
        background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 14, textDecoration: 'none',
      }}
    >
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.productName} width={52} height={52} loading="lazy"
          style={{ borderRadius: 10, objectFit: 'contain', background: '#fff', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: fonts.body, fontSize: 13.5, fontWeight: 600, color: colors.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.productName}
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.navy400, lineHeight: 1.5 }}>{children}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 700, color: colors.navy }}>{formatPrice(item.current)}</div>
        <div style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.navy400 }}>{item.store}</div>
      </div>
    </a>
  )
}

export async function PriceCheckPage({ id }: { id: SalesEventId }) {
  const report = await getPriceCheck()
  const bf = salesEvent(id)
  const year = bf.date.getUTCFullYear()
  const bfDate = formatDateEs(bf.date.toISOString())
  const other = salesEvent(id === 'black-friday' ? 'cyber-monday' : 'black-friday')

  const lowest = report?.lowest.slice(0, LIMIT) ?? []
  const inflated = report?.inflated.slice(0, LIMIT) ?? []
  const raised = report?.raised.slice(0, LIMIT) ?? []

  const faqs: Faq[] = [
    {
      q: `¿Cómo sé si una oferta de ${bf.name} es real?`,
      a: 'Compara el precio de oferta con el precio más bajo que tuvo ese mismo producto, en esa misma tienda, durante los 30 días anteriores. Si la “oferta” no queda por debajo de ese mínimo, el descuento es sobre un precio que subió antes. Es el mismo criterio que usa la Unión Europea para los descuentos anunciados.',
    },
    {
      q: `¿Cuándo es ${bf.name} en ${COUNTRY_NAME}?`,
      a: id === 'black-friday'
        ? `Este año es el viernes ${bfDate}. Muchas tiendas de ${countryShortName(COUNTRY)} adelantan las ofertas desde inicios de noviembre y las extienden hasta el Cyber Monday.`
        : `Este año es el lunes ${bfDate}, tres días después de Black Friday. Muchas tiendas de ${countryShortName(COUNTRY)} extienden sus ofertas de Black Friday hasta ese día, sobre todo en sus tiendas en línea.`,
    },
    {
      q: '¿De dónde salen estos datos?',
      a: `DóndeTa registra varias veces al día los precios publicados en las tiendas en línea de ${COUNTRY_NAME}${report ? ` (hoy seguimos ${report.tracked.toLocaleString(CURRENCY_LOCALE)} precios con al menos una semana de historial)` : ''}. Los veredictos se recalculan con cada actualización.`,
    },
    {
      q: `¿Conviene esperar a ${bf.name} para comprar?`,
      a: 'Solo si el precio baja de verdad. Si un producto que te interesa aparece abajo en "Subieron de precio", su precio actual está por encima de lo que costaba hace pocas semanas: crea una alerta y compra cuando vuelva a su mínimo o lo rompa.',
    },
  ]

  return (
    <main style={pageMain}>
      <SiteHeader />
      <Breadcrumb items={[{ href: SITE_URL, label: 'DóndeTa' }, { href: '/precios', label: 'Precios' }, { label: `${bf.name} ${year}` }]} />
      <h1 style={h1Style}>{bf.name} {year} en {COUNTRY_NAME}: ¿la oferta es real?</h1>

      <div style={{ background: colors.navy, color: '#fff', borderRadius: 16, padding: '16px 18px', margin: '12px 0 14px' }}>
        <div style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 700 }}>
          {bf.phase === 'before' ? `Faltan ${bf.days} ${bf.days === 1 ? 'día' : 'días'}` : bf.phase === 'during' ? `¡Es ${bf.name}!` : `${bf.name} ya pasó`}
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 14, opacity: 0.85, marginTop: 2 }}>
          {bf.phase === 'after'
            ? 'Seguimos vigilando los precios para Navidad y el doble sueldo.'
            : `${bf.name} es el ${bf.weekday} ${bfDate}. Estamos vigilando los precios desde antes, para que nadie te venda una rebaja inflada.`}
        </div>
      </div>

      <p style={leadStyle}>
        Algunas tiendas suben el precio unas semanas antes y luego lo “rebajan”. Por eso comparamos cada precio con{' '}
        <b>el más bajo que tuvo en esa misma tienda en los últimos 30 días</b>. Si la oferta no rompe ese mínimo, no es una oferta.
      </p>

      {!report && <p style={leadStyle}>No pudimos cargar los precios ahora mismo. Intenta de nuevo en unos minutos.</p>}

      {report && (
        <>
          <Section title="✅ Ofertas reales" subtitle="Hoy cuestan menos que en cualquier día de los últimos 30 días">
            {lowest.length ? (
              lowest.map(item => (
                <CheckRow key={item.productId} item={item}>
                  <span style={badge(colors.primaryLight, colors.primary)}>{Math.abs(item.pctVsReference)}% bajo su mínimo</span>{' '}
                  antes, lo más bajo era {formatPrice(item.reference)}
                </CheckRow>
              ))
            ) : (
              <p style={leadStyle}>Hoy ningún producto está por debajo de su mínimo de 30 días. Cuando las ofertas sean reales, aparecerán aquí.</p>
            )}
          </Section>

          <Section title="⚠️ Rebajas infladas" subtitle="Bajaron, pero solo después de subir: el precio “rebajado” es el mismo o más que hace unas semanas">
            {inflated.length ? (
              inflated.map(item => (
                <CheckRow key={item.productId} item={item}>
                  <span style={badge('#FFF4E5', colors.accent)}>“Bajó” {item.pctBelowPeak}%</span>{' '}
                  desde {formatPrice(item.peak)} ({formatDateEs(item.peakDate)}), pero el {formatDateEs(item.referenceDate)} costaba {formatPrice(item.reference)}
                </CheckRow>
              ))
            ) : (
              <p style={leadStyle}>Hoy no detectamos rebajas infladas.</p>
            )}
          </Section>

          <Section title="👀 Subieron de precio" subtitle="Cuestan más que su mínimo de las últimas semanas. Si “bajan” en Black Friday hasta ese mínimo, no es oferta">
            {raised.length ? (
              raised.map(item => (
                <CheckRow key={item.productId} item={item}>
                  <span style={badge('#FDECEC', '#D64545')}>+{item.pctVsReference}%</span>{' '}
                  el {formatDateEs(item.referenceDate)} costaba {formatPrice(item.reference)}
                </CheckRow>
              ))
            ) : (
              <p style={leadStyle}>Hoy ningún precio está por encima de su mínimo reciente.</p>
            )}
          </Section>
        </>
      )}

      <FaqBlock items={faqs} />

      <p style={{ marginTop: 20, fontFamily: fonts.body, fontSize: 13, lineHeight: 1.7, color: colors.navy400 }}>
        Los precios cambian varias veces al día; confirma el precio final, el envío y la garantía con la tienda antes de comprar. Ve también{' '}
        <a href={other.path} style={{ color: colors.primary }}>{other.name}</a>,{' '}
        <a href="/comparaciones" style={{ color: colors.primary }}>dónde está más barato cada modelo</a> y nuestra{' '}
        <a href="/metodologia" style={{ color: colors.primary }}>metodología</a>.
      </p>
      <SiteFooter />
    </main>
  )
}
