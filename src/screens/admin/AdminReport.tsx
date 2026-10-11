import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { adminApi, type PriceComparison, type RetailerReport } from '../../api/admin'
import StoreLogo from '../../components/StoreLogo'
import { formatPrice } from '../../domain/currency'
import { colors, fonts, radii } from '../../design/tokens'
import { DailyBars, Empty, ShareBars, formatCount } from './charts'

// Suggested packages. Every price and the contact line are contentEditable on
// screen, so they can be adjusted per store right before saving the PDF.
const PACKAGES = [
  {
    name: 'Tienda destacada',
    price: 'RD$15,000 / mes',
    items: ['Sello "Destacado" en todas tus ofertas', 'Tu logo primero cuando empatas en precio', 'Reporte mensual de clics'],
  },
  {
    name: 'Visibilidad',
    price: 'RD$35,000 / mes',
    items: ['Todo lo de Tienda destacada', 'Banner en búsquedas y categorías', 'Rotación en la portada'],
    featured: true,
  },
  {
    name: 'Premium',
    price: 'RD$60,000 / mes',
    items: ['Todo lo de Visibilidad', 'Productos patrocinados en resultados', 'Campaña en alertas de precio'],
  },
]

export default function AdminReport() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const days = Number(params.get('days') ?? 30)
  const [report, setReport] = useState<RetailerReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    adminApi.report(slug, days)
      .then(result => { if (!cancelled) setReport(result) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)) })
    return () => { cancelled = true }
  }, [slug, days])

  useEffect(() => {
    if (report) document.title = `Propuesta DóndeTa — ${report.retailer.name}`
  }, [report])

  if (error) return <div style={{ padding: 24, fontFamily: fonts.body }}>No se pudo generar el reporte: {error}</div>
  if (!report) return <div style={{ padding: 24, fontFamily: fonts.body }}>Generando propuesta…</div>

  const { retailer, catalog, clicks } = report
  const ga = report.analytics.data
  const accent = retailer.color || colors.primary
  const winRate = retailer.compared ? Math.round((retailer.wins / retailer.compared) * 100) : 0
  const generated = new Date(report.generatedAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="report-root" style={{ background: '#E9EDF2', minHeight: '100vh', fontFamily: fonts.body, color: colors.navy }}>
      <style>{PRINT_CSS}</style>

      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 10, background: colors.navy, color: '#fff', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/admin" style={{ color: '#fff' }}>← Admin</Link>
        <span style={{ opacity: 0.75, fontSize: 13 }}>Precios y contacto se pueden editar haciendo clic sobre ellos.</span>
        <button type="button" onClick={() => window.print()} style={{ marginLeft: 'auto', background: colors.primary, color: '#fff', border: 'none', borderRadius: radii.sm, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>
          Descargar PDF
        </button>
      </div>

      {/* Page 1 -- cover + audience */}
      <section className="sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 22 }}>DóndeTa</div>
          <div style={{ fontSize: 12, color: colors.navy400 }}>{generated}</div>
        </div>
        <div style={{ margin: '36px 0 28px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <StoreLogo store={retailer.name} abbr={retailer.abbr} color={accent} size={72} borderRadius={16} />
          <div>
            <div style={{ fontSize: 13, color: colors.navy400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Propuesta de publicidad</div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 34, margin: '2px 0 0', letterSpacing: '-0.03em' }}>{retailer.name}</h1>
          </div>
        </div>
        <p style={lead}>
          DóndeTa es el comparador de precios de electrodomésticos de República Dominicana. Cada día registramos los precios de{' '}
          <b>{formatCount(catalog.products)} productos</b> en <b>{catalog.retailers} tiendas</b> y mostramos a cada comprador dónde le sale
          más barato, con un enlace directo a la tienda. Estas son las cifras de los últimos <b>{report.days} días</b>.
        </p>

        <div style={kpiGrid}>
          {ga && <Kpi label="Visitantes" value={formatCount(ga.totals.users)} hint={`${formatCount(ga.totals.pageViews)} páginas vistas`} />}
          <Kpi label={`Clics enviados a ${retailer.name}`} value={formatCount(retailer.clicks)} hint="compradores que fueron a tu web desde DóndeTa" color={accent} strong />
          <Kpi label="Tus productos en DóndeTa" value={formatCount(retailer.products)} hint={`${formatCount(retailer.compared)} comparados con otras tiendas`} />
          <Kpi label="Eres la más barata en" value={`${winRate}%`} hint={`${formatCount(retailer.wins)} de ${formatCount(retailer.compared)} comparados`} />
        </div>

        <h2 style={h2}>Compradores enviados a {retailer.name}</h2>
        {clicks.total ? <DailyBars points={clicks.byDay.map(d => ({ date: d.date, value: d.clicks }))} color={accent} /> : <Empty text="El conteo de clics por tienda comenzó recientemente; este gráfico se llena con los próximos días." />}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
          <div>
            <h3 style={h3}>Tus categorías en DóndeTa</h3>
            <ShareBars rows={report.categories.map(c => ({ label: c.label, value: c.products }))} color={accent} />
          </div>
          <div>
            <h3 style={h3}>{ga ? 'Cómo nos visitan' : 'Productos tuyos con más clics'}</h3>
            {ga
              ? <ShareBars rows={ga.devices.map(d => ({ label: d.label === 'mobile' ? 'Celular' : d.label === 'desktop' ? 'Computadora' : d.label, value: d.sessions }))} color={colors.navy600} />
              : clicks.topProducts.length
                ? <ShareBars rows={clicks.topProducts.slice(0, 6).map(p => ({ label: p.name, value: p.clicks }))} color={accent} />
                : <Empty />}
          </div>
        </div>
      </section>

      {/* Page 2 -- price position */}
      <section className="sheet">
        <h2 style={{ ...h2, marginTop: 0 }}>Tu posición de precio</h2>
        <p style={lead}>
          De los {formatCount(retailer.compared)} productos tuyos que también vende otra tienda, eres la opción más barata en{' '}
          <b>{formatCount(retailer.wins)}</b>
          {report.avgWinMargin ? <> (con una ventaja promedio de <b>{formatPrice(report.avgWinMargin)}</b>)</> : null}.
          Ahí DóndeTa ya te recomienda: el comprador ve tu precio primero.
        </p>
        <ComparisonTable title="Donde tu precio gana" rows={report.wins} mode="win" accent={accent} />
        <p style={{ ...lead, marginTop: 22 }}>
          En otros productos, un competidor aparece primero
          {report.avgLossGap ? <> por una diferencia promedio de <b>{formatPrice(report.avgLossGap)}</b></> : null}. Son los compradores que
          hoy se van a otra tienda: con un sello de <b>tienda destacada</b> o un <b>producto patrocinado</b> sigues a la vista aunque no seas
          el más barato.
        </p>
        <ComparisonTable title="Donde otra tienda aparece primero" rows={report.losses} mode="loss" accent={accent} />
      </section>

      {/* Page 3 -- formats + packages */}
      <section className="sheet">
        <h2 style={{ ...h2, marginTop: 0 }}>Así se vería {retailer.name} en DóndeTa</h2>
        <div style={{ display: 'grid', gap: 18 }}>
          <Mockup title="1 · Tienda destacada en cada comparación">
            <div style={{ border: `1px solid ${colors.border}`, borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
              <OfferRow logo={<StoreLogo store={retailer.name} abbr={retailer.abbr} color={accent} size={34} />} store={retailer.name} price={sampleWin(report)?.myPrice} highlight accent={accent} badge="DESTACADO" />
              <OfferRow logo={<Dot />} store={sampleWin(report)?.otherStore ?? 'Otra tienda'} price={sampleWin(report)?.otherPrice} />
            </div>
          </Mockup>

          <Mockup title="2 · Banner en búsquedas y categorías">
            <div style={{ background: `linear-gradient(120deg, ${accent} 0%, ${shade(accent)} 100%)`, color: '#fff', borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 6 }}>
                <StoreLogo store={retailer.name} abbr={retailer.abbr} color={accent} size={52} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 20 }}>Ofertas de la semana en {retailer.name}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Electrodomésticos con envío a todo el país</div>
              </div>
              <div style={{ background: '#fff', color: accent, borderRadius: 999, padding: '8px 16px', fontWeight: 800, fontSize: 13 }}>Ver ofertas</div>
            </div>
          </Mockup>

          <Mockup title="3 · Producto patrocinado al inicio de los resultados">
            {(() => {
              const product = report.wins[0] ?? report.losses[0]
              return (
                <div style={{ border: `1.5px solid ${accent}`, borderRadius: 14, padding: 14, display: 'flex', gap: 14, alignItems: 'center', background: '#fff' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: '#F8FAFC', overflow: 'hidden', flexShrink: 0 }}>
                    {product?.image && <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: '0.08em' }}>PATROCINADO · {retailer.name.toUpperCase()}</div>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product?.name ?? 'Tu producto'}</div>
                    <div style={{ fontFamily: fonts.display, fontWeight: 800, color: colors.primary, fontSize: 18 }}>{product ? formatPrice(product.myPrice) : ''}</div>
                  </div>
                  <div style={{ background: colors.primary, color: '#fff', borderRadius: 10, padding: '9px 14px', fontWeight: 700, fontSize: 13 }}>Ver oferta</div>
                </div>
              )
            })()}
          </Mockup>
        </div>

        <h2 style={h2}>Paquetes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PACKAGES.map(pkg => (
            <div key={pkg.name} style={{ border: `1.5px solid ${pkg.featured ? accent : colors.border}`, borderRadius: 14, padding: 14, background: '#fff' }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 15 }}>{pkg.name}</div>
              <div contentEditable suppressContentEditableWarning style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 18, color: pkg.featured ? accent : colors.navy, margin: '6px 0 10px' }}>{pkg.price}</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: colors.navy600, display: 'grid', gap: 4 }}>
                {pkg.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p contentEditable suppressContentEditableWarning style={{ ...lead, fontSize: 13, marginTop: 12 }}>
          También ofrecemos costo por clic: pagas solo por cada comprador que enviamos a tu tienda (RD$15 por clic).
        </p>

        <div style={{ marginTop: 26, borderTop: `1px solid ${colors.border}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 700 }}>Hablemos</div>
            <div contentEditable suppressContentEditableWarning style={{ color: colors.navy600 }}>Equipo DóndeTa · tu correo · tu teléfono</div>
          </div>
          <div style={{ textAlign: 'right', color: colors.navy400 }}>
            {window.location.host.replace(/^www\./, '')}<br />Datos propios de DóndeTa{ga ? ' y Google Analytics' : ''}, {generated}
          </div>
        </div>
      </section>
    </div>
  )
}

function sampleWin(report: RetailerReport): PriceComparison | undefined {
  return report.wins[0] ?? report.losses[0]
}

// A darker variant of the store color for the banner gradient.
function shade(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const f = (v: number) => Math.max(0, Math.round(v * 0.7)).toString(16).padStart(2, '0')
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`
}

function ComparisonTable({ title, rows, mode, accent }: { title: string; rows: PriceComparison[]; mode: 'win' | 'loss'; accent: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <h3 style={h3}>{title}</h3>
      {rows.length ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr>
              {['Producto', 'Tu precio', mode === 'win' ? 'Siguiente tienda' : 'Más barato en', mode === 'win' ? 'Tu ventaja' : 'Diferencia'].map(h => (
                <th key={h} style={{ textAlign: 'left', color: colors.navy400, fontWeight: 600, padding: '6px 8px', borderBottom: `1px solid ${colors.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.slug}>
                <td style={cell}>{row.name}</td>
                <td style={{ ...cell, fontWeight: 700, color: mode === 'win' ? accent : colors.navy }}>{formatPrice(row.myPrice)}</td>
                <td style={cell}>{row.otherStore} · {formatPrice(row.otherPrice)}</td>
                <td style={{ ...cell, fontWeight: 700, color: mode === 'win' ? colors.primary : colors.error }}>
                  {formatPrice(Math.abs(row.otherPrice - row.myPrice))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <Empty text="Sin productos en esta situación por ahora." />}
    </div>
  )
}

function Mockup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.navy400, marginBottom: 6 }}>{title}</div>
      <div style={{ background: colors.background, borderRadius: 16, padding: 14 }}>{children}</div>
    </div>
  )
}

function OfferRow({ logo, store, price, highlight, accent, badge }: { logo: React.ReactNode; store: string; price?: number; highlight?: boolean; accent?: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: highlight ? '#E6F7F3' : '#fff', borderLeft: highlight ? `4px solid ${accent}` : '4px solid transparent' }}>
      {logo}
      <div style={{ flex: 1, fontWeight: 700 }}>
        {store}
        {badge && <span style={{ marginLeft: 8, background: accent, color: '#fff', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>{badge}</span>}
      </div>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 17 }}>{price ? formatPrice(price) : ''}</div>
    </div>
  )
}

function Dot() {
  return <div style={{ width: 34, height: 34, borderRadius: 10, background: colors.navy50 }} />
}

function Kpi({ label, value, hint, color, strong }: { label: string; value: string; hint: string; color?: string; strong?: boolean }) {
  return (
    <div style={{ background: strong ? color : '#fff', color: strong ? '#fff' : colors.navy, border: `1px solid ${strong ? color : colors.border}`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 11.5, opacity: 0.85 }}>{label}</div>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 11.5, opacity: 0.75 }}>{hint}</div>
    </div>
  )
}

const lead: React.CSSProperties = { fontSize: 14, lineHeight: 1.6, color: colors.navy600, margin: '0 0 16px' }
const h2: React.CSSProperties = { fontFamily: fonts.display, fontSize: 18, margin: '26px 0 12px' }
const h3: React.CSSProperties = { fontFamily: fonts.display, fontSize: 14, margin: '0 0 10px' }
const cell: React.CSSProperties = { padding: '7px 8px', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, margin: '8px 0 6px' }

// A4 sheets on screen; on print each <section class="sheet"> is one page.
const PRINT_CSS = `
  .report-root .sheet {
    background: #fff; width: 210mm; min-height: 297mm; box-sizing: border-box;
    margin: 18px auto; padding: 16mm 15mm; box-shadow: 0 6px 24px rgba(15,29,45,0.12);
  }
  @media screen and (max-width: 860px) {
    .report-root .sheet { width: auto; min-height: 0; margin: 12px; padding: 20px 16px; }
  }
  @page { size: A4; margin: 0; }
  @media print {
    .no-print, .figma-bypass-link { display: none !important; }
    .report-root { background: #fff !important; }
    .report-root .sheet { margin: 0; box-shadow: none; break-after: page; }
    .report-root .sheet:last-child { break-after: auto; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`
