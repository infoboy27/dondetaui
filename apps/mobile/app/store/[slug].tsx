import { formatCount } from '../../src/domain/currency'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { storesApi, type Store, type StoreBranch } from '../../src/api/stores'
import { friendlyError } from '../../src/api/errors'
import { openInApp } from '../../src/domain/links'
import ProductCard from '../../src/components/ProductCard'
import StoreLogo from '../../src/components/StoreLogo'
import StoreBranchRow from '../../src/components/StoreBranchRow'
import Button from '../../src/components/ui/Button'
import EmptyState from '../../src/components/ui/EmptyState'
import SectionHeader from '../../src/components/ui/SectionHeader'
import { ProductRowSkeleton } from '../../src/components/ui/Skeleton'
import { colors, radii, spacing } from '../../src/design/tokens'
import { type } from '../../src/design/type'

// How many branches show before "Ver todas".
const BRANCH_PREVIEW = 3

export default function StoreDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<StoreBranch[]>([])
  const [allBranches, setAllBranches] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

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
        if (!cancelled) setError(friendlyError(e, 'No pudimos cargar esta tienda.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug, attempt])

  const openProduct = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  if (error) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Stack.Screen options={{ title: 'Tienda' }} />
        <EmptyState icon="storefront" title="No se pudo abrir la tienda" message={error} actionTitle="Reintentar" onAction={() => setAttempt(n => n + 1)} />
      </View>
    )
  }

  const shownBranches = allBranches ? branches : branches.slice(0, BRANCH_PREVIEW)

  return (
    <>
      <Stack.Screen options={{ title: store?.name ?? '' }} />
      <FlatList
        data={loading ? [] : products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ProductCard product={item} onPress={() => openProduct(item)} />}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.screen}
        contentContainerStyle={styles.content}
        initialNumToRender={8}
        ListHeaderComponent={
          store ? (
            <View>
              <View style={styles.hero}>
                <StoreLogo abbr={store.abbr} color={store.color} size={60} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.subheadline, styles.muted]}>
                    {formatCount(store.productCount)} productos{branches.length ? ` · ${branches.length} sucursales` : ''}
                  </Text>
                </View>
              </View>
              {!!store.websiteUrl && (
                <Button title="Visitar la tienda en línea" icon="arrowUpRight" variant="tinted" onPress={() => openInApp(store.websiteUrl!)} style={styles.website} />
              )}

              {branches.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Sucursales"
                    actionTitle={branches.length > BRANCH_PREVIEW ? (allBranches ? 'Ver menos' : `Ver todas (${branches.length})`) : undefined}
                    onAction={() => setAllBranches(v => !v)}
                  />
                  <View style={styles.list}>
                    {shownBranches.map((branch, index) => (
                      <StoreBranchRow key={branch.id} branch={branch} divider={index < shownBranches.length - 1} />
                    ))}
                  </View>
                </View>
              )}

              <SectionHeader title="Ofertas actuales" count={products.length || undefined} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading
            ? <View><ProductRowSkeleton /><ProductRowSkeleton /><ProductRowSkeleton /></View>
            : <EmptyState icon="shippingbox" title="Sin productos todavía" message="Aún no tenemos precios de esta tienda." />
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs, marginBottom: spacing.lg },
  muted: { color: colors.secondaryLabel },
  website: { marginBottom: spacing.xxl },
  section: { marginBottom: spacing.xxl },
  list: { backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden' },
})
