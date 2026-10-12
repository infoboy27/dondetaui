import { useEffect, useState } from 'react'
import { adminApi, type CampaignReport } from '../../api/admin'
import { colors, fonts, radii, shadows } from '../../design/tokens'
import { Empty, formatCount } from './charts'
import { utmLink } from './utm'

const PERIODS = [7, 30, 90]

// Campaign tracking: GA4 sessions and store visits (click_offer) per
// utm_source/medium/campaign, plus a link builder so every paid promotion
// carries utm_medium=paid and shows up here as its own row.
export default function Campaigns() {
  const [days, setDays] = useState(30)
  const [report, setReport] = useState<CampaignReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setReport(null)
    setError(null)
    adminApi.campaigns(days)
      .then(value => { if (!cancelled) setReport(value) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)) })
    return () => { cancelled = true }
  }, [days])

  const rows = report?.rows ?? []
  const paid = rows.filter(row => row.paid)
  const paidSessions = paid.reduce((sum, row) => sum + row.sessions, 0)
  const paidClicks = paid.reduce((sum, row) => sum + row.offerClicks, 0)

  return (
    <section style={{ minWidth: 0, background: colors.card, borderRadius: radii.lg, border: `1px solid ${colors.border}`, boxShadow: shadows.sm, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <h2 style={{ fontFamily: fonts.display, fontSize: 16, margin: 0 }}>Campañas (Google Analytics)</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIODS.map(period => (
            <button key={period} type="button" onClick={() => setDays(period)} aria-pressed={days === period} style={pill(days === period)}>
              {period} días
            </button>
          ))}
        </div>
      </div>

      {error ? <Empty text={`No se pudieron cargar las campañas: ${error}`} />
        : !report ? <Empty text="Cargando campañas…" />
        : !report.configured ? <Empty text="Google Analytics no está configurado en este servidor (GA_PROPERTY_ID / GA_SERVICE_ACCOUNT_JSON)." />
        : report.error ? <Empty text={`GA4 está configurado pero falló: ${report.error}`} />
        : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Kpi label="Visitas pagadas" value={formatCount(paidSessions)} />
              <Kpi label="Clics a tiendas (pagadas)" value={formatCount(paidClicks)} />
              <Kpi label="Clics por visita pagada" value={paidSessions ? `${((paidClicks / paidSessions) * 100).toFixed(1)}%` : '—'} />
            </div>
            {rows.length === 0 ? <Empty text="Sin visitas en este periodo." /> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>{['Fuente / medio', 'Campaña', 'Visitas', 'Usuarios', 'Con interacción', 'Clics a tiendas'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={`${row.source}|${row.medium}|${row.campaign}`}>
                        <td style={td}>
                          {row.source} / {row.medium}
                          {row.paid && <span style={badge}>PAGADA</span>}
                        </td>
                        <td style={td}>{row.campaign}</td>
                        <td style={td}>{formatCount(row.sessions)}</td>
                        <td style={td}>{formatCount(row.users)}</td>
                        <td style={td}>{formatCount(row.engagedSessions)}</td>
                        <td style={td}>{formatCount(row.offerClicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      <LinkBuilder />
    </section>
  )
}

function LinkBuilder() {
  const [url, setUrl] = useState(`${window.location.origin}/`)
  const [source, setSource] = useState('instagram')
  const [medium, setMedium] = useState('paid')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)
  const link = campaign.trim() ? utmLink({ url, source, medium, campaign }) : null

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the link is on screen to copy by hand.
    }
  }

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.navy400, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        Enlace para una promoción
      </div>
      <p style={{ fontSize: 13, color: colors.navy400, margin: '0 0 10px' }}>
        Usa este enlace como sitio web de la promoción (Instagram → Promocionar → Tu sitio web). Sin él, la visita
        pagada se cuenta como Instagram orgánico.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        <Field label="Página" value={url} onChange={setUrl} />
        <Field label="Campaña" value={campaign} onChange={setCampaign} placeholder="eneba-lanzamiento" />
        <Field label="Fuente" value={source} onChange={setSource} />
        <Field label="Medio" value={medium} onChange={setMedium} />
      </div>
      {link && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
          <code style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', fontSize: 12, background: colors.background, borderRadius: radii.md, padding: '8px 10px' }}>{link}</code>
          <button type="button" onClick={copy} style={pill(true)}>{copied ? '¡Copiado!' : 'Copiar'}</button>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: colors.navy400 }}>
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        style={{ border: `1px solid ${colors.border}`, borderRadius: radii.md, padding: '8px 10px', fontSize: 13, color: colors.navy, fontFamily: fonts.body }}
      />
    </label>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: radii.lg, border: `1px solid ${colors.border}`, padding: 14 }}>
      <div style={{ fontSize: 12, color: colors.navy400, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>{value}</div>
    </div>
  )
}

const pill = (active: boolean): React.CSSProperties => ({
  cursor: 'pointer', borderRadius: radii.full, padding: '6px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0,
  background: active ? colors.navy : '#fff', color: active ? '#fff' : colors.navy,
  border: `1px solid ${active ? colors.navy : colors.border}`,
})
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', color: colors.navy400, fontWeight: 600, borderBottom: `1px solid ${colors.border}`, whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '10px', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'middle' }
const badge: React.CSSProperties = { marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: colors.accent, borderRadius: radii.full, padding: '2px 7px' }
