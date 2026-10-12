import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Product } from '../src/types'
import { productsApi } from '../src/api/products'
import DiscountCode from '../src/components/DiscountCode'
import EnebaBadge from '../src/components/EnebaBadge'
import ProductCard from '../src/components/ProductCard'
import { GAMING_FILTERS, compareGaming, gamingKind, type GamingKind } from '../src/domain/gaming'
import { colors, radii, spacing } from '../src/design/tokens'
import { fonts } from '../src/design/fonts'

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

  const load = async (pull = false) => {
    if (pull) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      setProducts((await productsApi.highlights()).gaming)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar Gaming')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const sorted = useMemo(() => [...products].sort(compareGaming), [products])
  const filters = useMemo(
    () => GAMING_FILTERS
      .map(filter => ({ ...filter, count: products.filter(p => gamingKind(p) === filter.kind).length }))
      .filter(filter => filter.count > 0),
    [products],
  )
  const visible = kind ? sorted.filter(p => gamingKind(p) === kind) : sorted

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Volver">
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Gaming</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
      >
        <View style={styles.intro}>
          <View style={styles.introTop}>
            <Text style={styles.emoji}>🎮</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.introTitle}>Gaming</Text>
              <Text style={styles.introText}>Recargas, suscripciones y juegos digitales · Entrega inmediata</Text>
            </View>
          </View>
          <EnebaBadge />
          <DiscountCode compact />
          {filters.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {[{ kind: null, label: 'Todo', count: products.length }, ...filters].map(filter => {
                const active = kind === filter.kind
                return (
                  <Pressable
                    key={filter.kind ?? 'all'}
                    onPress={() => setKind(filter.kind)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {filter.label} <Text style={styles.chipCount}>{filter.count}</Text>
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          )}
        </View>

        {error && (
          <Pressable onPress={() => void load()} style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retry}>Toca para reintentar</Text>
          </Pressable>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : (
          visible.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)}
            />
          ))
        )}
        {!loading && !error && !visible.length && <Text style={styles.empty}>No hay productos de Gaming por ahora.</Text>}
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
  intro: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md, marginBottom: spacing.lg },
  introTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 28, width: 52, height: 52, lineHeight: 52, textAlign: 'center', borderRadius: radii.md, backgroundColor: colors.background, overflow: 'hidden' },
  introTitle: { fontSize: 20, fontFamily: fonts.display.bold, color: colors.navy },
  introText: { fontSize: 12, fontFamily: fonts.body.regular, color: colors.navy400, marginTop: 2 },
  chips: { gap: 6 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', borderRadius: radii.full, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontFamily: fonts.body.bold, color: colors.navy },
  chipTextActive: { color: '#fff' },
  chipCount: { fontFamily: fonts.body.medium, opacity: 0.6 },
  errorBox: { backgroundColor: '#FFF1F2', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: '#BE123C', fontFamily: fonts.body.bold },
  retry: { color: '#BE123C', fontFamily: fonts.body.regular, fontSize: 12 },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
})
