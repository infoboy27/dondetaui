import { formatCount } from '../../../src/domain/currency'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActionSheetIOS, FlatList, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
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
import SearchOptionsSheet from '../../../src/components/SearchOptionsSheet'
import { NO_FILTERS, SORT_KEYS, SORT_LABELS, activeFilterCount, applySearchOptions, pruneFilters, type SearchFilters, type SortKey } from '../../../src/domain/searchOptions'
import { haptics } from '../../../src/design/haptics'
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
  // Sort and filters stay while the user refines the query; selections the
  // new results don't have (a store, a brand) are dropped.
  const [sort, setSort] = useState<SortKey>('relevance')
  const [filters, setFilters] = useState<SearchFilters>(NO_FILTERS)
  const [optionsOpen, setOptionsOpen] = useState(false)
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
      setFilters(current => pruneFilters(current, found))
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
  const shown = useMemo(() => applySearchOptions(results, sort, filters), [results, sort, filters])
  const filterCount = activeFilterCount(filters)

  useEffect(() => setVisibleCount(BATCH), [sort, filters])

  const chooseSort = () => {
    if (Platform.OS !== 'ios') {
      setOptionsOpen(true)
      return
    }
    ActionSheetIOS.showActionSheetWithOptions(
      { title: 'Ordenar por', options: [...SORT_KEYS.map(key => SORT_LABELS[key]), 'Cancelar'], cancelButtonIndex: SORT_KEYS.length, tintColor: colors.primaryDark },
      index => {
        const key = SORT_KEYS[index]
        if (key) {
          haptics.selection()
          setSort(key)
        }
      },
    )
  }

  const clearOptions = () => {
    setSort('relevance')
    setFilters(NO_FILTERS)
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Buscar' }} />
      {Platform.OS === 'ios' ? (
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
      ) : (
        // Android's toolbar search collapses to an icon; a visible field
        // matches Material's search bar and the home screen's search pill.
        <View style={styles.androidField}>
          <Icon name="search" size={20} color={colors.tertiaryLabel} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => searchNow(query)}
            placeholder="Productos, marcas o modelos"
            placeholderTextColor={colors.tertiaryLabel}
            returnKeyType="search"
            autoCapitalize="none"
            style={[type.body, styles.androidInput]}
            accessibilityLabel="Buscar productos"
          />
          {query.length > 0 && (
            <Touchable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Borrar búsqueda">
              <Icon name="closeCircle" size={18} color={colors.tertiaryLabel} />
            </Touchable>
          )}
        </View>
      )}

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
          data={status === 'done' ? withAdSlots(shown.slice(0, visibleCount)) : []}
          keyExtractor={entry => (entry.kind === 'ad' ? entry.key : entry.item.id)}
          renderItem={({ item: entry }) =>
            entry.kind === 'ad' ? <NativeAdCard /> : <ProductCard product={entry.item} onPress={() => openProduct(entry.item)} />}
          onEndReached={() => setVisibleCount(count => (count < shown.length ? count + BATCH : count))}
          onEndReachedThreshold={0.6}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          style={styles.screen}
          ListHeaderComponent={
            status === 'done' && results.length > 0 ? (
              <View>
                <View style={styles.toolbar}>
                  <Touchable onPress={chooseSort} style={[styles.pill, sort !== 'relevance' && styles.pillActive]} accessibilityRole="button" accessibilityLabel={`Ordenar por: ${SORT_LABELS[sort]}`}>
                    <Icon name="sort" size={14} color={sort !== 'relevance' ? colors.primaryDark : colors.navy} />
                    <Text style={[type.subheadline, styles.pillText, sort !== 'relevance' && styles.pillTextActive]} numberOfLines={1}>{SORT_LABELS[sort]}</Text>
                    <Icon name="chevronDown" size={11} color={sort !== 'relevance' ? colors.primaryDark : colors.tertiaryLabel} weight="semibold" />
                  </Touchable>
                  <Touchable onPress={() => setOptionsOpen(true)} style={[styles.pill, filterCount > 0 && styles.pillActive]} accessibilityRole="button" accessibilityLabel={filterCount ? `Filtros, ${filterCount} activos` : 'Filtros'}>
                    <Icon name="filter" size={14} color={filterCount ? colors.primaryDark : colors.navy} />
                    <Text style={[type.subheadline, styles.pillText, filterCount > 0 && styles.pillTextActive]}>{filterCount ? `Filtros · ${filterCount}` : 'Filtros'}</Text>
                  </Touchable>
                </View>
                <Text style={[type.footnote, styles.count]}>
                  {filterCount
                    ? `${formatCount(shown.length)} de ${formatCount(results.length)} resultados para “${term}”`
                    : `${results.length === 1 ? '1 resultado' : `${formatCount(results.length)} resultados`} para “${term}”`}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            status === 'loading' ? (
              <View><ProductRowSkeleton /><ProductRowSkeleton /><ProductRowSkeleton /><ProductRowSkeleton /></View>
            ) : status === 'done' && results.length > 0 ? (
              <EmptyState icon="filter" title="Ningún resultado con estos filtros" message="Prueba quitando algún filtro o cambiando el rango de precio." actionTitle="Quitar filtros" onAction={clearOptions} />
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

      <SearchOptionsSheet
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        results={results}
        sort={sort}
        onSortChange={setSort}
        filters={filters}
        onFiltersChange={setFilters}
      />
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
  toolbar: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xs },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radii.full, paddingHorizontal: 14, minHeight: 36, flexShrink: 1 },
  pillActive: { backgroundColor: colors.primaryLight },
  pillText: { color: colors.navy, flexShrink: 1 },
  pillTextActive: { color: colors.primaryDark },
  androidField: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 52, borderRadius: 26,
    backgroundColor: colors.fillStrong, paddingHorizontal: spacing.lg, marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  androidInput: { flex: 1, color: colors.navy, paddingVertical: 0 },
})
