import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import AdBanner from '../../src/components/AdBanner'
import DealCard from '../../src/components/DealCard'
import ProductCard from '../../src/components/ProductCard'
import PaginationControls from '../../src/components/PaginationControls'
import { usePagination } from '../../src/hooks/usePagination'
import { compareByRelevance, getTopComparisons } from '../../src/domain/offers'
import { getTopPriceDrops } from '../../src/domain/notifications'
import { gamingKind, gamingShowcase } from '../../src/domain/gaming'
import DiscountCode from '../../src/components/DiscountCode'
import EnebaBadge from '../../src/components/EnebaBadge'
import { formatPrice } from '../../src/domain/currency'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

export default function HomeScreen() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Same home as the web app: real comparisons first, then real price drops,
  // then the whole catalog with multi-store products on top.
  const sorted = useMemo(() => [...products].sort(compareByRelevance), [products])
  const comparisons = useMemo(() => getTopComparisons(products, 10), [products])
  const drops = useMemo(() => getTopPriceDrops(products, 10), [products])
  const gaming = useMemo(() => gamingShowcase(products), [products])
  const { page, pageSize, totalPages, total, pageItems, setPage, setPageSize } = usePagination(sorted)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setProducts(await productsApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo')
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      setProducts(await productsApi.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openProduct = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>BUSCA · COMPARA · AHORRA</Text>
          <Text style={styles.heroTitle}>Antes de comprar,{'\n'}mira DóndeTa.</Text>
          <Text style={styles.heroText}>Compara precios de tiendas dominicanas en segundos.</Text>
        </View>

        <Pressable onPress={() => router.push('/nearby-stores')} style={styles.nearbyCard}>
          <Text style={styles.nearbyIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.nearbyTitle}>Tiendas cercanas</Text>
            <Text style={styles.nearbyText}>Encuentra la sucursal más cerca de ti</Text>
          </View>
          <Text style={styles.nearbyChevron}>›</Text>
        </Pressable>

        {error && (
          <Pressable onPress={() => void load()} style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retry}>Toca para reintentar</Text>
          </Pressable>
        )}

        <AdBanner />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : (
          <>
            {comparisons.length > 0 && (
              <View style={styles.dealSection}>
                <Text style={styles.sectionTitle}>Comparaciones del día</Text>
                <Text style={styles.sectionSubtitle}>El mismo producto, más barato en otra tienda</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealRow} style={styles.dealScroll}>
                  {comparisons.map(entry => (
                    <DealCard
                      key={entry.product.id}
                      product={entry.product}
                      storeCount={entry.stores}
                      highlight={{ label: `Ahorras ${formatPrice(entry.savings)}` }}
                      onPress={() => openProduct(entry.product)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            {drops.length > 0 && (
              <View style={styles.dealSection}>
                <Text style={styles.sectionTitle}>Bajaron de precio</Text>
                <Text style={styles.sectionSubtitle}>Según nuestro historial de precios</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealRow} style={styles.dealScroll}>
                  {drops.map(drop => (
                    <DealCard
                      key={drop.product.id}
                      product={drop.product}
                      highlight={{ label: `Bajó ${drop.pct}%`, wasPrice: drop.oldPrice }}
                      onPress={() => openProduct(drop.product)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            {gaming.length > 0 && (
              <View style={styles.dealSection}>
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>🎮 Gaming</Text>
                    <Text style={styles.sectionSubtitle}>Recargas y juegos digitales · Entrega inmediata</Text>
                  </View>
                  <Pressable onPress={() => router.push('/gaming')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Ver todo Gaming">
                    <Text style={styles.seeAll}>Ver todo</Text>
                  </Pressable>
                </View>
                <View style={styles.gamingIntro}>
                  <EnebaBadge />
                  <DiscountCode compact />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealRow} style={styles.dealScroll}>
                  {gaming.map(product => (
                    <DealCard
                      key={product.id}
                      product={product}
                      highlight={{ label: gamingKind(product) }}
                      onPress={() => openProduct(product)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Todos los productos</Text>
              <Text style={styles.count}>{products.length}</Text>
            </View>
            {pageItems.map(product => (
              <ProductCard key={product.id} product={product} onPress={() => openProduct(product)} />
            ))}
            {!products.length && <Text style={styles.empty}>No encontramos productos.</Text>}
            <PaginationControls
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl + spacing.md },
  hero: { backgroundColor: colors.primary, borderRadius: radii.xxl, padding: spacing.xl, marginBottom: spacing.xl },
  heroEyebrow: { color: '#BDF5E8', fontFamily: fonts.display.extrabold, fontSize: 11, letterSpacing: 1 },
  heroTitle: { color: '#fff', fontFamily: fonts.display.extrabold, fontSize: 28, lineHeight: 34, marginTop: spacing.sm },
  heroText: { color: '#CFEDE5', fontFamily: fonts.body.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  nearbyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.xl },
  nearbyIcon: { fontSize: 22 },
  nearbyTitle: { color: colors.navy, fontFamily: fonts.display.bold, fontSize: 14 },
  nearbyText: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 12, marginTop: 2 },
  nearbyChevron: { fontSize: 22, color: colors.navy200 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontFamily: fonts.display.extrabold, color: colors.navy },
  sectionSubtitle: { fontSize: 12, fontFamily: fonts.body.regular, color: colors.navy400, marginTop: 2 },
  dealSection: { marginBottom: spacing.xl },
  seeAll: { color: colors.primary, fontFamily: fonts.body.bold, fontSize: 13 },
  gamingIntro: { gap: spacing.sm, marginTop: spacing.sm },
  // Bleed the row to the screen edges so cards scroll under the page padding.
  dealScroll: { marginHorizontal: -spacing.xl, marginTop: spacing.md },
  dealRow: { gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xs },
  count: { backgroundColor: colors.primaryLight, color: colors.primary, fontFamily: fonts.display.extrabold, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.full },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
  errorBox: { backgroundColor: '#FFF1F2', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: '#BE123C', fontFamily: fonts.body.bold },
  retry: { color: '#BE123C', fontFamily: fonts.body.regular, fontSize: 12 },
})
