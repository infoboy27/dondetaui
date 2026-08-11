import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import { useAppState } from '../../src/state/AppStateContext'
import { getPriceDropNotifications } from '../../src/domain/notifications'
import { formatPrice } from '../../src/domain/currency'
import ProductCard from '../../src/components/ProductCard'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

type Tab = 'alertas' | 'favoritos'

export default function AlertsScreen() {
  const router = useRouter()
  const { user, favoriteIds, alertedIds } = useAppState()
  const [tab, setTab] = useState<Tab>('alertas')
  const ids = tab === 'alertas' ? alertedIds : favoriteIds

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([...ids].map(id => productsApi.get(id).catch(() => null)))
      .then(results => {
        if (!cancelled) setProducts(results.filter((p): p is Product => p !== null))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ids.size])

  const openProduct = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  const notifications = tab === 'alertas' ? getPriceDropNotifications(products, alertedIds) : []

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{tab === 'alertas' ? 'Mis alertas' : 'Favoritos'}</Text>
        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('alertas')} style={[styles.tab, tab === 'alertas' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'alertas' && styles.tabTextActive]}>🔔 Alertas</Text>
          </Pressable>
          <Pressable onPress={() => setTab('favoritos')} style={[styles.tab, tab === 'favoritos' && styles.tabActive]}>
            <Text style={[styles.tabText, tab === 'favoritos' && styles.tabTextActive]}>♥ Favoritos</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!user && tab === 'alertas' ? (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>Inicia sesión para crear alertas de precio.</Text>
            <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Iniciar sesión</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : (
          <>
            {notifications.length > 0 && (
              <View style={styles.notifications}>
                <Text style={styles.notifTitle}>Bajaron de precio</Text>
                {notifications.map(n => (
                  <Pressable key={n.product.id} onPress={() => openProduct(n.product)} style={styles.notifRow}>
                    <Text style={styles.notifProduct} numberOfLines={1}>{n.product.name}</Text>
                    <Text style={styles.notifDrop}>-{n.pct}% · ahora {formatPrice(n.newPrice)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {products.length ? (
              products.map(product => (
                <ProductCard key={product.id} product={product} onPress={() => openProduct(product)} />
              ))
            ) : (
              <Text style={styles.empty}>
                {tab === 'alertas'
                  ? 'Todavía no tienes alertas. Toca la campana en cualquier producto para avisarte cuando baje de precio.'
                  : 'Todavía no tienes favoritos. Toca el corazón en cualquier producto para guardarlo aquí.'}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontFamily: fonts.display.extrabold, color: colors.navy, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radii.md, padding: 3 },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontFamily: fonts.body.medium, color: colors.navy400, fontSize: 13 },
  tabTextActive: { color: colors.navy, fontFamily: fonts.body.bold },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
  loginPrompt: { alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.md },
  loginText: { color: colors.navy400, fontFamily: fonts.body.regular, textAlign: 'center' },
  loginButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.md },
  loginButtonText: { color: '#fff', fontFamily: fonts.body.bold },
  notifications: { backgroundColor: colors.primaryLight, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg },
  notifTitle: { color: colors.primary, fontFamily: fonts.display.bold, fontSize: 12, marginBottom: spacing.sm },
  notifRow: { paddingVertical: spacing.xs },
  notifProduct: { color: colors.navy, fontFamily: fonts.body.bold, fontSize: 13 },
  notifDrop: { color: colors.accent, fontFamily: fonts.body.bold, fontSize: 12 },
})
