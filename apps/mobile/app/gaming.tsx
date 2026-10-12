import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Product } from '../src/types'
import { productsApi } from '../src/api/products'
import { friendlyError } from '../src/api/errors'
import DiscountCode from '../src/components/DiscountCode'
import EnebaBadge from '../src/components/EnebaBadge'
import ProductCard from '../src/components/ProductCard'
import EmptyState from '../src/components/ui/EmptyState'
import Touchable from '../src/components/ui/Touchable'
import { ProductRowSkeleton } from '../src/components/ui/Skeleton'
import { GAMING_FILTERS, compareGaming, gamingKind, type GamingKind } from '../src/domain/gaming'
import { colors, spacing } from '../src/design/tokens'
import { type } from '../src/design/type'
import { haptics } from '../src/design/haptics'

// The Gaming section (web: SectionHeader + ResultsScreen for category
// "gaming"): Eneba top-ups, subscriptions and PC keys, with the affiliate
// code up top and one-tap filters by kind.
export default function GamingScreen() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<GamingKind | null>(null)

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      setProducts((await productsApi.highlights()).gaming)
    } catch (e) {
      setError(friendlyError(e, 'No pudimos cargar Gaming.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sorted = useMemo(() => [...products].sort(compareGaming), [products])
  const filters = useMemo(
    () => GAMING_FILTERS
      .map(filter => ({ ...filter, count: products.filter(p => gamingKind(p) === filter.kind).length }))
      .filter(filter => filter.count > 0),
    [products],
  )
  const visible = kind ? sorted.filter(p => gamingKind(p) === kind) : sorted

  return (
    <FlatList
      data={loading || error ? [] : visible}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <ProductCard product={item} onPress={() => router.push(`/product/${encodeURIComponent(item.slug ?? item.id)}`)} />
      )}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={styles.intro}>
          <Text style={[type.subheadline, styles.muted]}>Recargas, suscripciones y juegos digitales. Entrega inmediata a tu correo.</Text>
          <EnebaBadge />
          <DiscountCode />
          {filters.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
              {[{ kind: null, label: 'Todo', count: products.length }, ...filters].map(filter => {
                const active = kind === filter.kind
                return (
                  <Touchable
                    key={filter.kind ?? 'all'}
                    onPress={() => {
                      haptics.selection()
                      setKind(filter.kind)
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[type.subheadlineEmphasized, active ? styles.chipTextActive : styles.chipText]}>
                      {filter.label} <Text style={styles.chipCount}>{filter.count}</Text>
                    </Text>
                  </Touchable>
                )
              })}
            </ScrollView>
          )}
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View><ProductRowSkeleton /><ProductRowSkeleton /><ProductRowSkeleton /></View>
        ) : error ? (
          <EmptyState icon="wifiSlash" title="Algo salió mal" message={error} actionTitle="Reintentar" onAction={() => void load()} />
        ) : (
          <EmptyState icon="gamecontroller" title="Nada por aquí" message="No hay productos de Gaming por ahora." />
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page },
  intro: { gap: spacing.md, marginBottom: spacing.lg, marginTop: spacing.xs },
  muted: { color: colors.secondaryLabel },
  chipScroll: { marginHorizontal: -spacing.lg },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: { backgroundColor: colors.card, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.navy },
  chipText: { color: colors.navy },
  chipTextActive: { color: '#fff' },
  chipCount: { opacity: 0.55 },
})
