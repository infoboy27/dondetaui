import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useAppState } from '../src/state/AppStateContext'
import { savedSearchesApi } from '../src/api/savedSearches'
import { friendlyError } from '../src/api/errors'
import { canSaveSearch, parseMaxPrice } from '../src/domain/savedSearches'
import { getCountry } from '../src/domain/currentCountry'
import { ListRow, ListSection } from '../src/components/ui/GroupedList'
import Button from '../src/components/ui/Button'
import { colors, spacing } from '../src/design/tokens'
import { type } from '../src/design/type'
import { haptics } from '../src/design/haptics'

// Saves the current search (from Buscar) so the alerts worker can tell the
// user when a matching product appears or drops under the max price. Listed
// and deleted in Perfil › Notificaciones.
export default function SaveSearchScreen() {
  const router = useRouter()
  const { q } = useLocalSearchParams<{ q?: string }>()
  const { push } = useAppState()
  const query = (q ?? '').trim()
  const [maxPrice, setMaxPrice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const parsed = parseMaxPrice(maxPrice)
    if (!parsed.ok) { setError(parsed.error); return }
    setBusy(true)
    setError(null)
    try {
      await savedSearchesApi.save(query, parsed.value)
      haptics.success()
      // Following something is when the app may ask for push permission.
      push.onFollow()
      router.back()
    } catch (e) {
      setError(friendlyError(e, 'No pudimos guardar la búsqueda. Intenta de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Guardar búsqueda' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={styles.content}>
        <ListSection header="Búsqueda">
          <ListRow icon="search" title={query || '—'} />
        </ListSection>
        <ListSection
          header="Precio máximo (opcional)"
          footer="Te avisamos cuando aparezca un producto nuevo para esta búsqueda o cuando uno baje de este precio. Puedes borrarla en Perfil › Notificaciones."
        >
          <View style={styles.inputRow}>
            <Text style={[type.body, styles.currency]}>{getCountry().currencySymbol}</Text>
            <TextInput
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Sin límite"
              placeholderTextColor={colors.tertiaryLabel}
              keyboardType="number-pad"
              returnKeyType="done"
              style={[type.body, styles.input]}
              accessibilityLabel="Precio máximo"
            />
          </View>
        </ListSection>
        <Button title="Guardar búsqueda" icon="bellFill" loading={busy} disabled={!canSaveSearch(query)} onPress={() => void save()} />
        {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: spacing.lg },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.lg },
  currency: { color: colors.secondaryLabel },
  input: { flex: 1, color: colors.navy, paddingVertical: 0 },
  error: { color: colors.error, textAlign: 'center', marginTop: spacing.md },
})
