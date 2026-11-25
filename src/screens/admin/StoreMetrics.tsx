import { useEffect, useState } from 'react'
import { adminApi, type StoresReport } from '../../api/admin'
import { colors, fonts, radii, shadows } from '../../design/tokens'
import { DailyBars, Empty, ShareBars, formatCount } from './charts'

// App downloads (Google Play, App Store) and ad earnings (AdMob, AdSense) on
// the /admin dashboard. GET /admin/stores, cached 30 min server-side; each
// source can be unconfigured or failing without hiding the others.

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
const COUNTRY = new Intl.DisplayNames(['es'], { type: 'region' })
const countryName = (code: string) => { try { return COUNTRY.of(code) ?? code } catch { return code } }

export default function StoreMetrics({ days }: { days: number }) {
  const [data, setData] = useState<StoresReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    adminApi.stores(days)
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)) })
    return () => { cancelled = true }
  }, [days])

  if (error) return <Card title="Descargas e ingresos"><Empty text={`No se pudieron cargar: ${error}`} /></Card>
  if (!data) return <Card title="Descargas e ingresos"><Empty text="Cargando descargas e ingresos…" /></Card>

  const play = data.play.data
  const ios = data.appStore.data
  const money = data.earnings.data
  const admob = money?.admob
  const adsense = money?.adsense
  const totalEarnings = (admob?.earnings ?? 0) + (adsense?.earnings ?? 0)
  const impressions = (admob?.impressions ?? 0) + (adsense?.impressions ?? 0)
  const earningsByDay = (admob ?? adsense)?.byDay.map((d, i) => ({ date: d.date, value: Math.round(((admob?.byDay[i]?.value ?? 0) + (adsense?.byDay[i]?.value ?? 0)) * 100) })) ?? []

  return (
    <>
      <Card title="Descargas de la app">
        <div style={kpiGrid}>
          <Kpi label="Android · descargas" value={play ? formatCount(play.installs) : '—'} hint={play ? `${formatCount(play.uninstalls)} desinstalaciones` : status(data.play, 'Google Play')} accent />
          <Kpi label="Android · dispositivos activos" value={play?.activeDevices != null ? formatCount(play.activeDevices) : '—'} hint="con la app instalada hoy" />
          <Kpi label="iPhone · descargas" value={ios ? formatCount(ios.downloads) : '—'} hint={ios ? `${formatCount(ios.updates)} actualizaciones` : status(data.appStore, 'App Store')} accent />
        </div>
        <div style={{ ...grid2, marginTop: 18 }}>
          <div>
            <Sub>Android por día</Sub>
            {play ? <DailyBars points={play.byDay.map(d => ({ date: d.date, value: d.installs }))} /> : <Empty text={status(data.play, 'Google Play')} />}
          </div>
          <div>
            <Sub>iPhone por día</Sub>
            {ios ? <DailyBars points={ios.byDay} color={colors.navy600} /> : <Empty text={status(data.appStore, 'App Store')} />}
          </div>
          <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
            <Sub>Países</Sub>
            <ShareBars rows={mergeCountries(play?.byCountry ?? [], ios?.byCountry ?? [])} />
          </div>
        </div>
        <Note>Google y Apple publican estos números con 1 a 2 días de atraso.</Note>
      </Card>

      <Card title="Ingresos por anuncios">
        <div style={kpiGrid}>
          <Kpi label="Total del período" value={money ? usd.format(totalEarnings) : '—'} hint={money ? `${formatCount(impressions)} anuncios vistos` : status(data.earnings, 'AdMob y AdSense')} accent />
          <Kpi label="App (AdMob)" value={admob ? usd.format(admob.earnings) : '—'} hint={admob ? `${formatCount(admob.impressions)} vistas · ${formatCount(admob.clicks)} clics` : money ? 'sin datos de AdMob' : '—'} />
          <Kpi label="Web (AdSense)" value={adsense ? usd.format(adsense.earnings) : '—'} hint={adsense ? `${formatCount(adsense.impressions)} vistas · ${formatCount(adsense.clicks)} clics` : money ? 'sin datos de AdSense' : '—'} />
          <Kpi label="Ganancia por 1,000 vistas" value={impressions ? usd.format((totalEarnings / impressions) * 1000) : '—'} hint="eCPM, app y web juntas" />
        </div>
        {money && (
          <div style={{ ...grid2, marginTop: 18 }}>
            <div>
              <Sub>Ingresos por día (centavos de USD)</Sub>
              <DailyBars points={earningsByDay} color={colors.accent} />
            </div>
            <div>
              <Sub>Saldo hacia el próximo pago</Sub>
              <Payout balance={money.balance} threshold={money.payoutThreshold} />
            </div>
          </div>
        )}
        <Note>Ganancias estimadas por Google; el monto final se confirma a inicio de cada mes. AdMob y AdSense comparten saldo y se pagan juntos al llegar a {usd.format(money?.payoutThreshold ?? 100)}.</Note>
      </Card>
    </>
  )
}

function status(source: { configured: boolean; error: string | null }, name: string) {
  if (source.error) return `${name} falló: ${source.error}`
  return source.configured ? 'Sin datos todavía' : `${name} no está conectado todavía`
}

function mergeCountries(play: Array<{ label: string; installs: number }>, ios: Array<{ label: string; downloads: number }>) {
  const totals = new Map<string, number>()
  for (const c of play) totals.set(c.label, (totals.get(c.label) ?? 0) + c.installs)
  for (const c of ios) totals.set(c.label, (totals.get(c.label) ?? 0) + c.downloads)
  return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([code, value]) => ({ label: countryName(code), value }))
}

function Payout({ balance, threshold }: { balance: number | null; threshold: number }) {
  if (balance == null) return <Empty text="El saldo aparece cuando Google lo reporta." />
  const pct = Math.min(100, (balance / threshold) * 100)
  return (
    <div style={{ fontFamily: fonts.body }}>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 26 }}>{usd.format(balance)} <span style={{ fontSize: 14, color: colors.navy400, fontWeight: 600 }}>de {usd.format(threshold)}</span></div>
      <div style={{ background: colors.navy50, borderRadius: 999, height: 12, marginTop: 10 }}>
        <div style={{ width: `${Math.max(pct, balance > 0 ? 1 : 0)}%`, background: colors.accent, borderRadius: 999, height: 12 }} />
      </div>
      <div style={{ fontSize: 12, color: colors.navy400, marginTop: 6 }}>{pct.toFixed(1)} % del umbral de pago · a los $10 Google envía el PIN por correo</div>
    </div>
  )
}

const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20 }

function Card({ title, children }: { title: string; children: React.ReactNode }) {
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

function Note({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: colors.navy400, marginTop: 14 }}>{children}</div>
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? colors.primary : colors.card, color: accent ? '#fff' : colors.navy, borderRadius: radii.lg, border: `1px solid ${accent ? colors.primary : colors.border}`, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.75, overflowWrap: 'anywhere' }}>{hint}</div>
    </div>
  )
}
