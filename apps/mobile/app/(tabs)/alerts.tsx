import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import { useAppState } from '../../src/state/AppStateContext'
import ProductCard from '../../src/components/ProductCard'
import { colors, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

// Price alerts (creating/managing target-price notifications) are Phase D
// of the mobile plan -- this screen covers Phase C's favorites list, the
// one piece of "alerts" already meaningful once favorites are real.
export default function AlertsScreen() {
  const router = useRouter()
  const { favoriteIds } = useAppState()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([...favoriteIds].map(id => productsApi.get(id).catch(() => null)))
      .then(results => {
        if (!cancelled) setProducts(results.filter((p): p is Product => p !== null))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [favoriteIds])

  const openProduct = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favoritos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : products.length ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} onPress={() => openProduct(product)} />
          ))
        ) : (
          <Text style={styles.empty}>
            Todavía no tienes favoritos. Toca el corazón en cualquier producto para guardarlo aquí.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontFamily: fonts.display.extrabold, color: colors.navy },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
})
