import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import ProductCard from '../../src/components/ProductCard'
import PaginationControls from '../../src/components/PaginationControls'
import { usePagination } from '../../src/hooks/usePagination'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

export default function HomeScreen() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { page, pageSize, totalPages, total, pageItems, setPage, setPageSize } = usePagination(products)

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

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Precios destacados</Text>
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
  count: { backgroundColor: colors.primaryLight, color: colors.primary, fontFamily: fonts.display.extrabold, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.full },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
  errorBox: { backgroundColor: '#FFF1F2', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: '#BE123C', fontFamily: fonts.body.bold },
  retry: { color: '#BE123C', fontFamily: fonts.body.regular, fontSize: 12 },
})
