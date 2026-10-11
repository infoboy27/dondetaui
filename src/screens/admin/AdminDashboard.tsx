import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type AdminOverview } from '../../api/admin'
import StoreLogo from '../../components/StoreLogo'
import { colors, fonts, radii, shadows } from '../../design/tokens'
import type { User } from '../../types'
import { DailyBars, Empty, ShareBars, formatCount } from './charts'

const PERIODS = [7, 30, 90] as const

export default function AdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [days, setDays] = useState<number>(30)
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    adminApi.overview(days)
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)) })
    return () => { cancelled = true }
  }, [days])

  const ga = data?.analytics.data

  return (
    <div style={{ minHeight: '100vh', background: colors.background, fontFamily: fonts.body, color: colors.navy }}>
      <header style={{ background: colors.card, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ ...container, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 16px' }}>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 20 }}>
            DóndeTa <span style={{ color: colors.primary }}>Admin</span>
          </div>
          <div style={{ display: 'flex', gap: 4, background: colors.background, borderRadius: radii.md, padding: 3 }}>
            {PERIODS.map(p => (
              <button key={p} type="button" onClick={() => setDays(p)} aria-pressed={days === p} style={{
                border: 'none', cursor: 'pointer', borderRadius: radii.sm, padding: '6px 12px', fontWeight: 700, fontSize: 13, fontFamily: fonts.body,
                background: days === p ? colors.card : 'transparent', color: days === p ? colors.primary : colors.navy400,
              }}>
                {p} días
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center', fontSize: 13, color: colors.navy400 }}>
            <a href="/" style={{ color: colors.navy400 }}>Ver sitio</a>
            <span>{user.email}</span>
            <button type="button" onClick={onLogout} style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Salir</button>
          </div>
        </div>
      </header>

      <main style={{ ...container, padding: '20px 16px 60px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
        {error && <Card><span style={{ color: colors.error }}>No se pudieron cargar las métricas: {error}</span></Card>}
        {!data && !error && <Card>Cargando métricas…</Card>}

        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <Kpi label="Visitantes" value={ga ? formatCount(ga.totals.users) : '—'} hint={ga ? `${formatCount(ga.totals.sessions)} sesiones` : 'Conecta GA4'} />
              <Kpi label="Páginas vistas" value={ga ? formatCount(ga.totals.pageViews) : '—'} hint={ga ? `${Math.round(ga.totals.avgSessionSeconds / 60)} min por sesión` : 'Conecta GA4'} />
              <Kpi label="Clics a tiendas" value={formatCount(data.clicks.total)} hint={`últimos ${data.days} días`} accent />
              <Kpi label="Productos" value={formatCount(data.catalog.products)} hint={`${formatCount(data.catalog.offers)} ofertas vigentes`} />
              <Kpi label="Comparados" value={formatCount(data.catalog.compared)} hint="en 2 tiendas o más" />
              <Kpi label="Tiendas" value={String(data.catalog.retailers)} hint="con precios vigentes" />
            </div>

            <Card title="Tráfico (Google Analytics)">
              {ga ? (
                <div style={grid2}>
                  <div>
                    <Sub>Visitantes por día</Sub>
                    <DailyBars points={ga.byDay.map(d => ({ date: d.date, value: d.users }))} color={colors.navy600} />
                  </div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div><Sub>Dispositivo</Sub><ShareBars rows={ga.devices.map(d => ({ label: deviceLabel(d.label), value: d.sessions }))} color={colors.navy600} /></div>
                    <div><Sub>Origen</Sub><ShareBars rows={ga.channels.slice(0, 5).map(c => ({ label: c.label, value: c.sessions }))} color={colors.navy600} /></div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                    <Sub>Páginas más vistas</Sub>
                    <ShareBars rows={ga.topPages.map(p => ({ label: p.label, value: p.pageViews }))} color={colors.navy200} />
                  </div>
                </div>
              ) : data.analytics.error ? (
                <Empty text={`GA4 está configurado pero falló: ${data.analytics.error}`} />
              ) : (
                <Empty text="GA4 no está conectado todavía. Agrega GA_PROPERTY_ID y GA_SERVICE_ACCOUNT_JSON al .env del servidor (ver .env.example)." />
              )}
            </Card>

            <Card title="Clics enviados a tiendas">
              <div style={grid2}>
                <div>
                  <Sub>Por día</Sub>
                  <DailyBars points={data.clicks.byDay.map(d => ({ date: d.date, value: d.clicks }))} />
                </div>
                <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                  <div><Sub>Por tienda</Sub><ShareBars rows={data.retailers.filter(r => r.clicks).map(r => ({ label: r.name, value: r.clicks }))} /></div>
                  <div><Sub>Por canal</Sub><ShareBars rows={data.clicks.bySource.map(s => ({ label: s.label === 'app' ? 'App Android' : 'Web', value: s.clicks }))} /></div>
                </div>
                <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                  <Sub>Productos con más clics</Sub>
                  {data.clicks.topProducts.length ? (
                    <Table head={['Producto', 'Tienda', 'Clics']} rows={data.clicks.topProducts.map(p => [p.name, p.store, formatCount(p.clicks)])} />
                  ) : <Empty />}
                </div>
              </div>
            </Card>

            <Card title="Tiendas y propuestas">
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>{['Tienda', 'Productos', 'Comparados', 'Más barata en', 'Clics', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.retailers.map(r => (
                      <tr key={r.slug}>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StoreLogo store={r.name} abbr={r.abbr} color={r.color} size={30} borderRadius={8} />
                            <strong>{r.name}</strong>
                          </div>
                        </td>
                        <td style={td}>{formatCount(r.products)}</td>
                        <td style={td}>{formatCount(r.compared)}</td>
                        <td style={td}>{formatCount(r.wins)}{r.compared ? ` (${Math.round((r.wins / r.compared) * 100)}%)` : ''}</td>
                        <td style={td}>{formatCount(r.clicks)}</td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <Link to={`/admin/reporte/${r.slug}?days=${days}`} style={{ background: colors.primary, color: '#fff', borderRadius: radii.sm, padding: '7px 12px', fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            Propuesta PDF
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Ingestión de precios">
              <Table
                head={['Tienda', 'Estado', 'Última corrida', 'Productos', 'Ofertas vigentes', 'Alertas']}
                rows={data.ingestion.map(r => [
                  r.retailer,
                  r.lastStatus === 'completed' ? '✅ ok' : r.lastStatus === 'running' ? '⏳ corriendo' : r.lastStatus === 'failed' ? '❌ falló' : '—',
                  r.lastFinishedAt ? new Date(r.lastFinishedAt).toLocaleString('es-DO') : '—',
                  formatCount(r.lastIngested),
                  formatCount(r.freshOffers),
                  r.problems.join('; ') || '—',
                ])}
              />
            </Card>

            <div style={{ fontSize: 12, color: colors.navy400 }}>Generado {new Date(data.generatedAt).toLocaleString('es-DO')}</div>
          </>
        )}
      </main>
    </div>
  )
}

function deviceLabel(value: string) {
  return value === 'mobile' ? 'Celular' : value === 'desktop' ? 'Computadora' : value === 'tablet' ? 'Tablet' : value
}

const container: React.CSSProperties = { maxWidth: 1180, margin: '0 auto', boxSizing: 'border-box' }
// minmax(min(...)) + minWidth 0 keep wide tables scrolling inside their card
// instead of stretching the whole page past a phone's width.
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', color: colors.navy400, fontWeight: 600, borderBottom: `1px solid ${colors.border}`, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '10px', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'middle' }

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section style={{ minWidth: 0, background: colors.card, borderRadius: radii.lg, border: `1px solid ${colors.border}`, boxShadow: shadows.sm, padding: 18 }}>
      {title && <h2 style={{ fontFamily: fonts.display, fontSize: 16, margin: '0 0 14px' }}>{title}</h2>}
      {children}
    </section>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: colors.navy400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{children}</div>
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? colors.primary : colors.card, color: accent ? '#fff' : colors.navy, borderRadius: radii.lg, border: `1px solid ${accent ? colors.primary : colors.border}`, padding: 16 }}>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{hint}</div>
    </div>
  )
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  if (!rows.length) return <Empty />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead><tr>{head.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={td}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
