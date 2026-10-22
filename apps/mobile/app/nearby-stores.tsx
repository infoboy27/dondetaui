import { useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Location from 'expo-location'
import { storesApi, type StoreBranch } from '../src/api/stores'
import { friendlyError } from '../src/api/errors'
import { getCountry } from '../src/config/currentCountry'
import StoreBranchRow from '../src/components/StoreBranchRow'
import EmptyState from '../src/components/ui/EmptyState'
import { colors, radii, spacing } from '../src/design/tokens'
import { type } from '../src/design/type'

// Used when the device can't (or won't) give a location: the country's main
// city (the catalog only has that country's stores).

type State =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'servicesOff' }
  | { status: 'noFix' }
  | { status: 'ready'; branches: StoreBranch[]; near: string | null }
  | { status: 'error'; message: string }

export default function NearbyStoresScreen() {
  const FALLBACK = getCountry().center
  const [state, setState] = useState<State>({ status: 'idle' })

  const loadBranches = async (latitude: number, longitude: number, near: string | null) => {
    try {
      const branches = await storesApi.nearby(latitude, longitude)
      setState({ status: 'ready', branches, near })
    } catch (e) {
      setState({ status: 'error', message: friendlyError(e, 'No pudimos cargar las sucursales.') })
    }
  }

  const findNearby = async () => {
    setState({ status: 'locating' })
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status !== 'granted') {
      setState({ status: 'denied', canAskAgain: permission.canAskAgain })
      return
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      setState({ status: 'servicesOff' })
      return
    }
    // A fresh fix can fail indoors or with weak GPS; a recent cached position
    // is good enough to rank stores by distance.
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .catch(() => Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 }))
      .catch(() => null)
    if (!position) {
      setState({ status: 'noFix' })
      return
    }
    await loadBranches(position.coords.latitude, position.coords.longitude, null)
  }

  const useFallback = () => {
    setState({ status: 'locating' })
    void loadBranches(FALLBACK.latitude, FALLBACK.longitude, FALLBACK.label)
  }

  const fallbackTitle = `Ver tiendas en ${FALLBACK.label}`

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
      {state.status === 'idle' && (
        <EmptyState
          icon="mappin"
          tone="brand"
          title="La sucursal más cerca de ti"
          message="Usamos tu ubicación solo para calcular la distancia a cada tienda. No la guardamos."
          actionTitle="Usar mi ubicación"
          onAction={() => void findNearby()}
          secondaryTitle={fallbackTitle}
          onSecondary={useFallback}
        />
      )}

      {state.status === 'locating' && (
        <View style={styles.locating}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[type.subheadline, styles.muted]}>Buscando tiendas cerca…</Text>
        </View>
      )}

      {state.status === 'denied' && (
        <EmptyState
          icon="location"
          title="Sin acceso a tu ubicación"
          message={state.canAskAgain
            ? 'Permite el acceso a tu ubicación para ver qué tiendas te quedan más cerca.'
            : 'Activa la ubicación para DóndeTa en Ajustes › DóndeTa › Ubicación.'}
          actionTitle={state.canAskAgain ? 'Permitir ubicación' : 'Abrir Ajustes'}
          onAction={() => (state.canAskAgain ? void findNearby() : void Linking.openSettings())}
          secondaryTitle={fallbackTitle}
          onSecondary={useFallback}
        />
      )}

      {state.status === 'servicesOff' && (
        <EmptyState
          icon="location"
          title="La ubicación está apagada"
          message="Actívala en Ajustes › Privacidad y seguridad › Localización, y vuelve a intentarlo."
          actionTitle="Intentar de nuevo"
          onAction={() => void findNearby()}
          secondaryTitle={fallbackTitle}
          onSecondary={useFallback}
        />
      )}

      {state.status === 'noFix' && (
        <EmptyState
          icon="location"
          tone="warning"
          title="No pudimos ubicarte"
          message="La señal de ubicación es débil en este momento. Intenta de nuevo cerca de una ventana o al aire libre."
          actionTitle="Intentar de nuevo"
          onAction={() => void findNearby()}
          secondaryTitle={fallbackTitle}
          onSecondary={useFallback}
        />
      )}

      {state.status === 'error' && (
        <EmptyState icon="wifiSlash" title="Algo salió mal" message={state.message} actionTitle="Intentar de nuevo" onAction={() => void findNearby()} />
      )}

      {state.status === 'ready' && (
        state.branches.length ? (
          <>
            <Text style={[type.footnote, styles.caption]}>
              {state.near ? `Cerca de ${state.near}` : 'Cerca de tu ubicación'} · {state.branches.length === 1 ? '1 sucursal' : `${state.branches.length} sucursales`}
            </Text>
            <View style={styles.list}>
              {state.branches.map((branch, index) => (
                <StoreBranchRow key={branch.id} branch={branch} divider={index < state.branches.length - 1} />
              ))}
            </View>
          </>
        ) : (
          <EmptyState
            icon="storefront"
            title="Sin sucursales cerca"
            message={state.near ? `Todavía no tenemos sucursales registradas cerca de ${state.near}.` : 'Todavía no tenemos sucursales registradas en tu zona.'}
            secondaryTitle={state.near ? undefined : fallbackTitle}
            onSecondary={state.near ? undefined : useFallback}
          />
        )
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page },
  locating: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.page },
  muted: { color: colors.secondaryLabel },
  caption: { color: colors.secondaryLabel, marginLeft: spacing.lg, marginBottom: 6, marginTop: spacing.sm },
  list: { backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden' },
})
