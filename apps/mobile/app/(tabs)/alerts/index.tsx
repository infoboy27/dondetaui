import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import type { Product } from '../../../src/types'
import { productsApi } from '../../../src/api/products'
import { useAppState } from '../../../src/state/AppStateContext'
import { getPriceDropNotifications } from '../../../src/domain/notifications'
import { formatPrice } from '../../../src/domain/currency'
import ProductCard from '../../../src/components/ProductCard'
import Icon from '../../../src/components/Icon'
import EmptyState from '../../../src/components/ui/EmptyState'
import SegmentedControl from '../../../src/components/ui/SegmentedControl'
import Touchable from '../../../src/components/ui/Touchable'
import { ProductRowSkeleton } from '../../../src/components/ui/Skeleton'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'

type Tab = 'favoritos' | 'alertas'

// Saved products: favorites (work without an account) and price alerts
// (need one), with any price drops on alerted products called out on top.
export default function SavedScreen() {
  const router = useRouter()
  const { user, favoriteIds, alertedIds } = useAppState()
  const [tab, setTab] = useState<Tab>('favoritos')
  const ids = tab === 'alertas' ? alertedIds : favoriteIds
  const idKey = [...ids].sort().join(',')

  // Products are tagged with the list they were loaded for, so switching
  // segments never flashes the other list while the new one loads.
  const listKey = `${tab}:${idKey}`
  const [loaded, setLoaded] = useState<{ key: string; products: Product[] }>({ key: '', products: [] })
  const loading = loaded.key !== listKey
  const products = loading ? [] : loaded.products

  useEffect(() => {
    let cancelled = false
    Promise.all([...ids].map(id => productsApi.get(id).catch(() => null)))
      .then(results => {
        if (!cancelled) setLoaded({ key: listKey, products: results.filter((p): p is Product => p !== null) })
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey])

  const openProduct = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  const notifications = tab === 'alertas' ? getPriceDropNotifications(products, alertedIds) : []
  const needsLogin = !user && tab === 'alertas'

  return (
    <>
      <Stack.Screen options={{ title: 'Guardados' }} />
      <FlatList
        data={needsLogin || loading ? [] : products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ProductCard product={item} onPress={() => openProduct(item)} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.screen}
        ListHeaderComponent={
          <View>
            <SegmentedControl
              segments={[{ value: 'favoritos', label: 'Favoritos' }, { value: 'alertas', label: 'Alertas de precio' }]}
              value={tab}
              onChange={setTab}
            />
            {notifications.length > 0 && (
              <View style={styles.drops}>
                <View style={styles.dropsHeader}>
                  <Icon name="trendDown" size={15} color={colors.primaryDark} weight="semibold" />
                  <Text style={[type.footnoteEmphasized, styles.dropsTitle]}>Bajaron de precio</Text>
                </View>
                {notifications.map(n => (
                  <Touchable key={n.product.id} onPress={() => openProduct(n.product)} style={styles.dropRow} accessibilityRole="button">
                    <Text style={[type.subheadlineEmphasized, styles.dropName]} numberOfLines={1}>{n.product.name}</Text>
                    <Text style={[type.footnote, styles.dropText]}>−{n.pct}% · ahora {formatPrice(n.newPrice)}</Text>
                  </Touchable>
                ))}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          needsLogin ? (
            <EmptyState
              icon="bellFill"
              tone="brand"
              title="Te avisamos cuando baje"
              message="Crea una cuenta gratis y te enviamos una notificación cuando baje el precio de lo que te interesa."
              actionTitle="Crear cuenta gratis"
              onAction={() => router.push({ pathname: '/auth', params: { reason: 'alerts', mode: 'register' } })}
              secondaryTitle="Ya tengo cuenta"
              onSecondary={() => router.push({ pathname: '/auth', params: { reason: 'alerts' } })}
            />
          ) : loading ? (
            <View><ProductRowSkeleton /><ProductRowSkeleton /></View>
          ) : tab === 'alertas' ? (
            <EmptyState
              icon="bell"
              title="Sin alertas todavía"
              message="Abre cualquier producto y toca la campana para que te avisemos cuando baje de precio."
            />
          ) : (
            <EmptyState
              icon="heart"
              title="Nada guardado todavía"
              message="Toca el corazón en cualquier producto para tenerlo a mano aquí."
              actionTitle="Explorar productos"
              onAction={() => router.navigate('/')}
            />
          )
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page, paddingTop: spacing.xs },
  drops: { backgroundColor: colors.primaryLight, borderRadius: radii.lg, borderCurve: 'continuous', padding: spacing.md, marginBottom: spacing.lg, gap: spacing.xs },
  dropsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  dropsTitle: { color: colors.primaryDark },
  dropRow: { paddingVertical: 4 },
  dropName: { color: colors.navy },
  dropText: { color: colors.accent },
})
