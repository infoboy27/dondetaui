import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import type { SearchBarCommands } from 'react-native-screens'
import type { Product } from '../../../src/types'
import { productsApi } from '../../../src/api/products'
import { friendlyError } from '../../../src/api/errors'
import NativeAdCard from '../../../src/ads/NativeAdCard'
import { withAdSlots } from '../../../src/domain/feed'
import ProductCard from '../../../src/components/ProductCard'
import Icon from '../../../src/components/Icon'
import EmptyState from '../../../src/components/ui/EmptyState'
import Touchable from '../../../src/components/ui/Touchable'
import { ProductRowSkeleton } from '../../../src/components/ui/Skeleton'
import { useRecentSearches } from '../../../src/hooks/useRecentSearches'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'

// Popular searches offered before the user types (the catalog is appliances,
// electronics and Eneba gaming).
const SUGGESTIONS = ['Neveras', 'Lavadoras', 'Aires acondicionados', 'Televisores', 'Estufas', 'Abanicos', 'Free Fire', 'Game Pass']
// Wait this long after the last keystroke before searching.
const DEBOUNCE_MS = 350
const BATCH = 24

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function SearchScreen() {
  const router = useRouter()
  const searchBar = useRef<SearchBarCommands>(null)
  const { recent, add: addRecent, clear: clearRecent } = useRecentSearches()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(BATCH)
  // Only the newest request may update the screen: a slow response for an
  // older query must not overwrite the results of the current one.
  const requestId = useRef(0)

  const run = useCallback(async (term: string) => {
    const value = term.trim()
    const id = ++requestId.current
    if (value.length < 2) {
      setStatus('idle')
      setResults([])
      return
    }
    setStatus('loading')
    try {
      const found = await productsApi.search(value)
      if (id !== requestId.current) return
      setResults(found)
      setVisibleCount(BATCH)
      setStatus('done')
    } catch (e) {
      if (id !== requestId.current) return
      setError(friendlyError(e, 'No pudimos completar la búsqueda.'))
      setStatus('error')
    }
  }, [])

  // Search as you type.
  useEffect(() => {
    const timer = setTimeout(() => void run(query), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, run])

  const searchNow = (term: string) => {
    searchBar.current?.setText(term)
    setQuery(term)
    addRecent(term)
    Keyboard.dismiss()
    void run(term)
  }

  const openProduct = (product: Product) => {
    addRecent(query)
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  const term = query.trim()

  return (
    <>
      <Stack.Screen options={{ title: 'Buscar' }} />
      <Stack.SearchBar
        ref={searchBar}
        placeholder="Productos, marcas o modelos"
        onChangeText={event => setQuery(event.nativeEvent.text)}
        onSearchButtonPress={event => searchNow(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
        hideWhenScrolling={false}
        autoCapitalize="none"
        tintColor={colors.primaryDark}
        cancelButtonText="Cancelar"
      />

      {status === 'idle' ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content} style={styles.screen}>
          {recent.length > 0 && (
            <View style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={[type.headline, styles.blockTitle]}>Recientes</Text>
                <Touchable onPress={clearRecent} hitSlop={8} accessibilityRole="button" accessibilityLabel="Borrar búsquedas recientes">
                  <Text style={[type.subheadline, styles.clear]}>Borrar</Text>
                </Touchable>
              </View>
              <View style={styles.list}>
                {recent.map((item, index) => (
                  <Touchable
                    key={item}
                    onPress={() => searchNow(item)}
                    style={[styles.recentRow, index < recent.length - 1 && styles.rowDivider]}
                    accessibilityRole="button"
                    accessibilityLabel={`Buscar ${item}`}
                  >
                    <Icon name="clock" size={16} color={colors.tertiaryLabel} />
                    <Text style={[type.body, styles.recentText]} numberOfLines={1}>{item}</Text>
                    <Icon name="chevronRight" size={13} color={colors.tertiaryLabel} />
                  </Touchable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.block}>
            <Text style={[type.headline, styles.blockTitle, styles.blockHeader]}>Sugerencias</Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map(item => (
                <Touchable key={item} onPress={() => searchNow(item)} style={styles.chip} accessibilityRole="button" accessibilityLabel={`Buscar ${item}`}>
                  <Text style={[type.subheadline, styles.chipText]}>{item}</Text>
                </Touchable>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={status === 'done' ? withAdSlots(results.slice(0, visibleCount)) : []}
          keyExtractor={entry => (entry.kind === 'ad' ? entry.key : entry.item.id)}
          renderItem={({ item: entry }) =>
            entry.kind === 'ad' ? <NativeAdCard /> : <ProductCard product={entry.item} onPress={() => openProduct(entry.item)} />}
          onEndReached={() => setVisibleCount(count => (count < results.length ? count + BATCH : count))}
          onEndReachedThreshold={0.6}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          style={styles.screen}
          ListHeaderComponent={
            status === 'done' && results.length > 0 ? (
              <View>
                <Text style={[type.footnote, styles.count]}>
                  {results.length === 1 ? '1 resultado' : `${results.length.toLocaleString('es-DO')} resultados`} para “{term}”
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            status === 'loading' ? (
              <View><ProductRowSkeleton /><ProductRowSkeleton /><ProductRowSkeleton /><ProductRowSkeleton /></View>
            ) : status === 'error' ? (
              <EmptyState icon="wifiSlash" title="Algo salió mal" message={error} actionTitle="Reintentar" onAction={() => void run(query)} />
            ) : (
              <EmptyState
                icon="search"
                title={`Sin resultados para “${term}”`}
                message="Por ahora comparamos electrodomésticos, electrónica y gaming. Revisa cómo se escribe o prueba con otra palabra."
              />
            )
          }
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page },
  block: { marginTop: spacing.lg },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  blockTitle: { color: colors.navy },
  clear: { color: colors.primaryDark },
  list: { backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, minHeight: 46 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  recentText: { flex: 1, color: colors.navy },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: colors.navy },
  count: { color: colors.secondaryLabel, marginBottom: spacing.sm, marginTop: spacing.xs },
})
