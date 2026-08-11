import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { storesApi, type StoreBranch } from '../src/api/stores'
import StoreBranchRow from '../src/components/StoreBranchRow'
import { colors, radii, spacing } from '../src/design/tokens'
import { fonts } from '../src/design/fonts'

type State =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'denied' }
  | { status: 'loading' }
  | { status: 'ready'; branches: StoreBranch[] }
  | { status: 'error'; message: string }

export default function NearbyStoresScreen() {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: 'idle' })

  const findNearby = async () => {
    setState({ status: 'requesting' })
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setState({ status: 'denied' })
      return
    }
    setState({ status: 'loading' })
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const branches = await storesApi.nearby(position.coords.latitude, position.coords.longitude)
      setState({ status: 'ready', branches })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'No se pudo obtener tu ubicación' })
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Tiendas cercanas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {state.status === 'idle' && (
          <View style={styles.prompt}>
            <Text style={styles.promptTitle}>Encuentra la tienda más cerca de ti</Text>
            <Text style={styles.promptText}>Usamos tu ubicación solo para calcular la distancia a cada sucursal.</Text>
            <Pressable onPress={() => void findNearby()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Usar mi ubicación</Text>
            </Pressable>
          </View>
        )}

        {(state.status === 'requesting' || state.status === 'loading') && (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        )}

        {state.status === 'denied' && (
          <View style={styles.prompt}>
            <Text style={styles.promptTitle}>No pudimos acceder a tu ubicación</Text>
            <Text style={styles.promptText}>Habilita el permiso de ubicación para DóndeTa en los ajustes de tu dispositivo e inténtalo de nuevo.</Text>
            <Pressable onPress={() => void findNearby()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {state.status === 'error' && (
          <View style={styles.prompt}>
            <Text style={styles.promptTitle}>{state.message}</Text>
            <Pressable onPress={() => void findNearby()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {state.status === 'ready' && (
          state.branches.length ? (
            state.branches.map(branch => <StoreBranchRow key={branch.id} branch={branch} />)
          ) : (
            <Text style={styles.empty}>No encontramos sucursales cerca de ti todavía.</Text>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { height: 56, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, lineHeight: 28, color: colors.navy },
  title: { fontSize: 17, fontFamily: fonts.display.extrabold, color: colors.navy },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  prompt: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.md },
  promptTitle: { fontSize: 16, fontFamily: fonts.display.bold, color: colors.navy, textAlign: 'center' },
  promptText: { fontFamily: fonts.body.regular, color: colors.navy400, textAlign: 'center', paddingHorizontal: spacing.lg },
  primaryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.md, marginTop: spacing.sm },
  primaryButtonText: { color: '#fff', fontFamily: fonts.body.bold },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
})
