import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type InstagramInsights } from '../../api/admin'
import { colors, fonts, radii, shadows } from '../../design/tokens'
import { DailyBars, Empty, ShareBars, formatCount } from './charts'

const FORMAT_LABEL = { reel: 'Reel', carousel: 'Carrusel', image: 'Imagen' } as const

// Instagram account and post metrics (GET /admin/instagram/insights, cached
// 15 min server-side). `compact` is the summary row on the /admin dashboard;
// the full version lives on /admin/instagram.
export default function InstagramMetrics({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<InstagramInsights | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    adminApi.igInsights()
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)) })
    return () => { cancelled = true }
  }, [])

  const title = compact ? (
    <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <span>Instagram{data ? ` · @${data.account.username}` : ''}</span>
      <Link to="/admin/instagram" style={{ fontFamily: fonts.body, fontSize: 13, color: colors.primary, fontWeight: 700 }}>Ver métricas y publicar →</Link>
    </span>
  ) : `Métricas de Instagram${data ? ` · @${data.account.username}` : ''}`

  if (error) return <Card title={title}><Empty text={`No se pudieron cargar las métricas de Instagram: ${error}`} /></Card>
  if (!data) return <Card title={title}><Empty text="Cargando métricas de Instagram…" /></Card>

  const { account, week, month } = data
  const net = month.follows !== null && month.unfollows !== null ? month.follows - month.unfollows : null
  const reachRate = account.followers ? Math.round((month.reach / account.followers) * 100) : 0

  const kpis = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
      <Kpi label="Seguidores" value={formatCount(account.followers)} hint={net === null ? `${formatCount(account.mediaCount)} publicaciones` : `${net >= 0 ? '+' : ''}${formatCount(net)} en 28 días (${formatCount(month.follows ?? 0)} nuevos, ${formatCount(month.unfollows ?? 0)} se fueron)`} />
      <Kpi label="Alcance" value={formatCount(month.reach)} hint={`cuentas en 28 días (${reachRate}% de tus seguidores) · ${formatCount(week.reach)} en 7`} accent />
      <Kpi label="Vistas" value={formatCount(month.views)} hint={`28 días · ${formatCount(week.views)} en 7`} />
      <Kpi label="Interacciones" value={formatCount(month.interactions)} hint={month.engaged === 1 ? "1 cuenta interactuó" : `${formatCount(month.engaged)} cuentas interactuaron`} />
      <Kpi label="Toques al enlace" value={formatCount(month.linkTaps)} hint="del perfil, 28 días" />
      <Kpi label="Visitas al sitio" value={data.siteVisits === null ? '—' : formatCount(data.siteVisits)} hint={data.siteVisits === null ? 'Conecta GA4' : 'desde Instagram, 28 días (GA4)'} />
    </div>
  )

  if (compact) return <Card title={title}>{kpis}</Card>

  const growth = data.followersHistory.length >= 2
  return (
    <Card title={title}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20 }}>
        {kpis}

        <div style={grid2}>
          <div style={{ minWidth: 0 }}>
            <Sub>Alcance por día</Sub>
            {data.reachByDay.length ? <DailyBars points={data.reachByDay} /> : <Empty />}
          </div>
          <div style={{ minWidth: 0 }}>
            <Sub>{growth ? 'Seguidores' : 'Seguidores nuevos por día'}</Sub>
            {growth
              ? <DailyBars points={data.followersHistory} color={colors.navy600} />
              : data.newFollowersByDay.length ? <DailyBars points={data.newFollowersByDay} color={colors.navy600} /> : <Empty />}
            {!growth && <div style={{ fontSize: 12, color: colors.navy400, marginTop: 6 }}>La curva de seguidores se arma con una foto diaria; desde mañana empieza a llenarse.</div>}
          </div>
        </div>

        <div>
          <Sub>Qué formato funciona mejor</Sub>
          {data.byFormat.length ? (
            <Table
              head={['Formato', 'Publicaciones', 'Alcance promedio', 'Vistas promedio', 'Interacciones promedio']}
              rows={data.byFormat.map(f => [FORMAT_LABEL[f.format], formatCount(f.posts), formatCount(f.avgReach), formatCount(f.avgViews), formatCount(f.avgInteractions)])}
            />
          ) : <Empty />}
        </div>

        <div>
          <Sub>Publicaciones recientes</Sub>
          {data.posts.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['Fecha', 'Formato', 'Publicación', 'Alcance', 'Vistas', '❤️', '💬', 'Guardados', 'Compartidos', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.posts.map(post => (
                    <tr key={post.id}>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{new Date(post.timestamp).toLocaleDateString('es-DO')}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{FORMAT_LABEL[post.format]}{post.source === 'autopilot' ? ' · auto' : ''}</td>
                      <td style={{ ...td, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.title}>{post.title || '—'}</td>
                      <td style={{ ...td, fontWeight: 700 }}>{formatCount(post.reach)}</td>
                      <td style={td}>{formatCount(post.views)}</td>
                      <td style={td}>{formatCount(post.likes)}</td>
                      <td style={td}>{formatCount(post.comments)}</td>
                      <td style={td}>{formatCount(post.saved)}</td>
                      <td style={td}>{formatCount(post.shares)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        {post.permalink && <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 700, whiteSpace: 'nowrap' }}>Ver ↗</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty text="Todavía no hay publicaciones en el feed." />}
        </div>

        <div style={grid3}>
          <div style={{ minWidth: 0 }}><Sub>Ciudades</Sub><ShareBars rows={data.cities} color={colors.navy600} /></div>
          <div style={{ minWidth: 0 }}><Sub>Edades</Sub><ShareBars rows={data.ages} color={colors.navy600} /></div>
          <div style={{ minWidth: 0 }}><Sub>Género</Sub><ShareBars rows={data.genders} color={colors.navy600} /></div>
        </div>

        <div style={{ fontSize: 12, color: colors.navy400 }}>
          Datos de Instagram, actualizados cada 15 minutos ({new Date(data.generatedAt).toLocaleString('es-DO')}). Las historias no aparecen: Instagram solo da sus métricas durante 24 horas.
        </div>
      </div>
    </Card>
  )
}

const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20 }
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 20 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', color: colors.navy400, fontWeight: 600, borderBottom: `1px solid ${colors.border}`, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '10px', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'middle' }

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ minWidth: 0, background: colors.card, borderRadius: radii.lg, border: `1px solid ${colors.border}`, boxShadow: shadows.sm, padding: 18 }}>
      <h2 style={{ fontFamily: fonts.display, fontSize: 16, margin: '0 0 14px' }}>{title}</h2>
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
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead><tr>{head.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={td}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
