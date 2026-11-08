import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack } from 'expo-router'
import { adminAccess, adminOverview, clearAdminToken, unlockAdmin, type AdminOverview } from '../../../src/api/admin'
import { ApiError } from '../../../src/api/http'
import { accountError, friendlyError } from '../../../src/api/errors'
import { formatCount, formatDuration, type AdminAccess } from '../../../src/domain/adminAccess'
import Button from '../../../src/components/ui/Button'
import SegmentedControl from '../../../src/components/ui/SegmentedControl'
import { CodeField } from '../../../src/components/ui/Fields'
import { ListRow, ListSection } from '../../../src/components/ui/GroupedList'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'
import { haptics } from '../../../src/design/haptics'

// The owner's metrics (same data as the web /admin overview). Only reachable
// from Perfil when the server says this account is the admin; every request
// is still checked server-side with the authenticator-code token.

type Period = '7' | '30' | '90'
const PERIODS: { value: Period; label: string }[] = [
  { value: '7', label: '7 días' },
  { value: '30', label: '30 días' },
  { value: '90', label: '90 días' },
]

export default function AdminScreen() {
  const [access, setAccess] = useState<AdminAccess | 'loading'>('loading')
  const [period, setPeriod] = useState<Period>('30')
  const [data, setData] = useState<AdminOverview | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (days: Period) => {
    setError(null)
    try {
      setData(await adminOverview(Number(days)))
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setData(null)
        setAccess(await adminAccess())
        return
      }
      setError(friendlyError(err, 'No se pudieron cargar las métricas.'))
    }
  }, [])

  useEffect(() => {
    let alive = true
    void adminAccess().then(result => {
      if (!alive) return
      setAccess(result)
      if (result === 'open') void load(period)
    })
    return () => { alive = false }
  }, [])

  const unlock = async (value = code) => {
    if (value.length !== 6) return
    setBusy(true)
    setError(null)
    try {
      await unlockAdmin(value)
      haptics.success()
      setCode('')
      setAccess('open')
      await load(period)
    } catch (err) {
      haptics.warning()
      setCode('')
      setError(accountError(err, 'Código incorrecto.'))
    } finally {
      setBusy(false)
    }
  }

  const changePeriod = (value: Period) => {
    setPeriod(value)
    void load(value)
  }

  const refresh = async () => {
    setRefreshing(true)
    await load(period)
    setRefreshing(false)
  }

  const lock = async () => {
    await clearAdminToken()
    setData(null)
    setAccess(await adminAccess())
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Métricas' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={access === 'open' ? <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} /> : undefined}
      >
        {access === 'loading' && <ActivityIndicator color={colors.primary} style={styles.loading} />}

        {access === 'none' && (
          <Text style={[type.body, styles.note]}>Esta sección no está disponible para tu cuenta.</Text>
        )}

        {access === 'setup' && (
          <Text style={[type.body, styles.note]}>
            Activa primero la verificación en dos pasos del panel desde dondeta.com.do/admin en una computadora. Después podrás entrar aquí con el mismo código.
          </Text>
        )}

        {access === 'locked' && (
          <View style={styles.unlock}>
            <Text style={[type.title3, styles.unlockTitle]}>Código de verificación</Text>
            <Text style={[type.subheadline, styles.unlockText]}>Escribe el código de 6 dígitos de tu app autenticadora. La sesión del panel dura 12 horas.</Text>
            <CodeField value={code} onChange={setCode} onComplete={value => void unlock(value)} />
            {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
            <Button title="Ver métricas" onPress={() => void unlock()} disabled={code.length !== 6} loading={busy} />
          </View>
        )}

        {access === 'open' && (
          <>
            <View style={styles.periods}>
              <SegmentedControl segments={PERIODS} value={period} onChange={changePeriod} />
            </View>
            {!!error && <Text style={[type.footnote, styles.error, styles.inset]}>{error}</Text>}
            {!data && !error && <ActivityIndicator color={colors.primary} style={styles.loading} />}
            {data && <Overview data={data} />}
            <ListSection>
              <ListRow title="Bloquear panel" destructive onPress={() => void lock()} />
            </ListSection>
          </>
        )}
      </ScrollView>
    </>
  )
}

function Overview({ data }: { data: AdminOverview }) {
  const ga = data.analytics.data
  const retailers = [...data.retailers].filter(r => r.clicks > 0).sort((a, b) => b.clicks - a.clicks)
  return (
    <>
      <View style={styles.tiles}>
        <Tile label="Usuarios" value={ga ? formatCount(ga.totals.users) : '—'} />
        <Tile label="Clics a tiendas" value={formatCount(data.clicks.total)} accent />
      </View>

      <ClicksChart byDay={data.clicks.byDay} />

      <ListSection
        header="Visitas (Google Analytics)"
        footer={!data.analytics.configured ? 'Google Analytics no está configurado en el servidor.' : data.analytics.error ? 'Google Analytics no respondió.' : undefined}
      >
        <ListRow title="Usuarios" value={ga ? formatCount(ga.totals.users) : '—'} />
        <ListRow title="Sesiones" value={ga ? formatCount(ga.totals.sessions) : '—'} />
        <ListRow title="Páginas vistas" value={ga ? formatCount(ga.totals.pageViews) : '—'} />
        <ListRow title="Duración media" value={ga ? formatDuration(ga.totals.avgSessionSeconds) : '—'} />
      </ListSection>

      <ListSection header="Clics por tienda">
        {retailers.length ? retailers.map(r => <ListRow key={r.slug} title={r.name} value={formatCount(r.clicks)} />) : <ListRow title="Sin clics en este período" />}
      </ListSection>

      {data.clicks.topProducts.length > 0 && (
        <ListSection header="Productos con más clics">
          {data.clicks.topProducts.slice(0, 5).map(p => (
            <ListRow key={`${p.slug}-${p.store}`} title={p.name} value={`${formatCount(p.clicks)} · ${p.store}`} />
          ))}
        </ListSection>
      )}

      {ga && ga.channels.length > 0 && (
        <ListSection header="De dónde llegan">
          {ga.channels.slice(0, 5).map(c => <ListRow key={c.label} title={c.label} value={formatCount(c.sessions)} />)}
        </ListSection>
      )}

      {ga && ga.topPages.length > 0 && (
        <ListSection header="Páginas más vistas">
          {ga.topPages.slice(0, 5).map(p => <ListRow key={p.label} title={p.label} value={formatCount(p.pageViews)} />)}
        </ListSection>
      )}

      {data.clicks.bySource.length > 0 && (
        <ListSection header="Clics por origen">
          {data.clicks.bySource.map(s => <ListRow key={s.label} title={s.label} value={formatCount(s.clicks)} />)}
        </ListSection>
      )}

      <ListSection header="Catálogo" footer={`Actualizado ${new Date(data.generatedAt).toLocaleString('es-DO')}`}>
        <ListRow title="Productos" value={formatCount(data.catalog.products)} />
        <ListRow title="Comparados (2+ tiendas)" value={formatCount(data.catalog.compared)} />
        <ListRow title="Ofertas vigentes" value={formatCount(data.catalog.offers)} />
        <ListRow title="Tiendas" value={formatCount(data.catalog.retailers)} />
      </ListSection>
    </>
  )
}

function Tile({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.tile}>
      <Text style={[type.footnote, styles.tileLabel]}>{label}</Text>
      <Text style={[type.title1, styles.tileValue, accent && { color: colors.primary }]}>{value}</Text>
    </View>
  )
}

function ClicksChart({ byDay }: { byDay: Array<{ date: string; clicks: number }> }) {
  if (byDay.length < 2) return null
  const max = Math.max(...byDay.map(d => d.clicks), 1)
  return (
    <View style={styles.chart} accessibilityLabel="Clics a tiendas por día">
      <Text style={[type.footnote, styles.tileLabel]}>Clics por día</Text>
      <View style={styles.bars}>
        {byDay.map(d => (
          <View key={d.date} style={[styles.bar, { height: Math.max(2, (d.clicks / max) * 64) }]} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.page * 2 },
  loading: { marginTop: spacing.page },
  note: { color: colors.secondaryLabel, margin: spacing.lg },
  inset: { marginHorizontal: spacing.lg },
  unlock: { margin: spacing.lg, gap: spacing.md },
  unlockTitle: { color: colors.navy },
  unlockText: { color: colors.secondaryLabel },
  error: { color: colors.error },
  periods: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg },
  tileLabel: { color: colors.secondaryLabel },
  tileValue: { color: colors.navy, marginTop: 4 },
  chart: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 64, marginTop: spacing.sm },
  bar: { flex: 1, backgroundColor: colors.primary, borderRadius: 2 },
})
