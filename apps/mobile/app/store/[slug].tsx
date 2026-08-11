import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { storesApi, type Store, type StoreBranch } from '../../src/api/stores'
import ProductCard from '../../src/components/ProductCard'
import StoreLogo from '../../src/components/StoreLogo'
import StoreBranchRow from '../../src/components/StoreBranchRow'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

export default function StoreDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<StoreBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([storesApi.get(slug), storesApi.products(slug), storesApi.branches(slug).catch(() => [])])
      .then(([storeResult, productsResult, branchesResult]) => {
        if (!cancelled) {
          setStore(storeResult)
          setProducts(productsResult)
          setBranches(branchesResult)
        }
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar la tienda')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  const openProduct = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (error || !store) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'No pudimos encontrar esta tienda'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <StoreLogo abbr={store.abbr} color={store.color} />
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeCount}>{store.productCount} productos</Text>
          </View>
        </View>

        {store.websiteUrl && (
          <Pressable onPress={() => void Linking.openURL(store.websiteUrl!)} style={styles.websiteButton}>
            <Text style={styles.websiteButtonText}>Ir a la tienda ↗</Text>
          </Pressable>
        )}

        {branches.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Sucursales ({branches.length})</Text>
            {branches.map(branch => <StoreBranchRow key={branch.id} branch={branch} />)}
          </>
        )}

        <Text style={styles.sectionTitle}>Ofertas actuales</Text>
        {products.length ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} onPress={() => openProduct(product)} />
          ))
        ) : (
          <Text style={styles.empty}>Todavía no tenemos productos de esta tienda.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: spacing.md },
  header: { height: 56, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, lineHeight: 28, color: colors.navy },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg },
  storeName: { fontSize: 22, fontFamily: fonts.display.black, color: colors.navy },
  storeCount: { fontFamily: fonts.body.regular, color: colors.navy400, fontSize: 12, marginTop: spacing.xs },
  websiteButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.xl },
  websiteButtonText: { color: '#fff', fontFamily: fonts.display.bold, fontSize: 14 },
  sectionTitle: { fontSize: 17, fontFamily: fonts.display.extrabold, color: colors.navy, marginBottom: spacing.md },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
  errorText: { color: '#BE123C', fontFamily: fonts.body.bold },
  backLink: { marginTop: spacing.md },
  backLinkText: { color: colors.primary, fontFamily: fonts.body.bold },
})
