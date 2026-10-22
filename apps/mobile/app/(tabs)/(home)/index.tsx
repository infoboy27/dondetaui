import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import type { Product } from '../../../src/types'
import { productsApi } from '../../../src/api/products'
import NativeAdCard from '../../../src/ads/NativeAdCard'
import { withAdSlots } from '../../../src/domain/feed'
import DealCard from '../../../src/components/DealCard'
import ProductCard from '../../../src/components/ProductCard'
import { compareByRelevance, getTopComparisons } from '../../../src/domain/offers'
import { getTopPriceDrops } from '../../../src/domain/notifications'
import { gamingKind, gamingShowcase } from '../../../src/domain/gaming'
import { blackFridayBanner } from '../../../src/domain/blackFriday'
import { openInApp } from '../../../src/domain/links'
import { appConfig } from '../../../src/config/env'
import DiscountCode from '../../../src/components/DiscountCode'
import EnebaBadge from '../../../src/components/EnebaBadge'
import Icon, { type IconName } from '../../../src/components/Icon'
import BrandTitle from '../../../src/components/BrandTitle'
import EmptyState from '../../../src/components/ui/EmptyState'
import SectionHeader from '../../../src/components/ui/SectionHeader'
import Touchable from '../../../src/components/ui/Touchable'
import { DealCardSkeleton, ProductRowSkeleton } from '../../../src/components/ui/Skeleton'
import { formatCount, formatPrice } from '../../../src/domain/currency'
import CountryBanner from '../../../src/components/CountryBanner'
import { useCountry } from '../../../src/hooks/useCountry'
import { useCountryPreference } from '../../../src/state/CountryContext'
import { friendlyError } from '../../../src/api/errors'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'

// Rows rendered per batch of the "Todos los productos" list; more load as
// the user nears the end (replaces the web-style page buttons).
const BATCH = 24

export default function HomeScreen() {
  const router = useRouter()
  const country = useCountry()
  const { pref } = useCountryPreference()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(BATCH)
  // Same home as the web app: real comparisons first, then real price drops,
  // then the whole catalog with multi-store products on top.
  const sorted = useMemo(() => [...products].sort(compareByRelevance), [products])
  const comparisons = useMemo(() => getTopComparisons(products, 10), [products])
  const drops = useMemo(() => getTopPriceDrops(products, 10), [products])
  const gaming = useMemo(() => gamingShowcase(products), [products])
  const visible = useMemo(() => withAdSlots(sorted.slice(0, visibleCount)), [sorted, visibleCount])

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      setProducts(await productsApi.list())
      setVisibleCount(BATCH)
    } catch (e) {
      setError(friendlyError(e, 'No pudimos cargar el catálogo.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // The device region isn't a country we serve: ask once.
  useEffect(() => {
    if (pref.needsChoice) router.push('/country')
  }, [pref.needsChoice, router])

  const openProduct = useCallback((product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }, [router])

  const blackFriday = blackFridayBanner()
  const header = (
    <View>
      <CountryBanner />
      <Touchable onPress={() => router.navigate('/search')} style={styles.searchPill} accessibilityRole="search" accessibilityLabel="Buscar productos">
        <Icon name="search" size={17} color={colors.tertiaryLabel} />
        <Text style={[type.body, styles.searchPillText]}>Neveras, televisores, juegos…</Text>
      </Touchable>

      <View style={styles.hero}>
        <Text style={[type.caption2, styles.heroEyebrow]}>BUSCA · COMPARA · AHORRA</Text>
        <Text style={[type.brand, styles.heroTitle]}>Antes de comprar,{'\n'}mira DóndeTa.</Text>
        <Text style={[type.subheadline, styles.heroText]}>
          {products.length
            ? `${formatCount(products.length)} productos comparados en tiendas ${country.storesAdjective}.`
            : `Compara precios de tiendas ${country.storesAdjective} en segundos.`}
        </Text>
      </View>

      <View style={styles.quickRow}>
        <QuickAction icon="scan" label="Escanear" onPress={() => router.navigate('/scanner')} />
        <QuickAction icon="location" label="Cerca de ti" onPress={() => router.push('/nearby-stores')} />
        <QuickAction icon="gamecontroller" label="Gaming" onPress={() => router.push('/gaming')} />
      </View>

      {blackFriday && (
        <Touchable
          onPress={() => openInApp(`${appConfig.apiBaseUrl.replace(/\/api$/, '')}/black-friday`)}
          style={styles.blackFriday}
          accessibilityRole="link"
          accessibilityLabel={`${blackFriday.title}. ${blackFriday.subtitle}`}
        >
          <Text style={[type.headline, styles.blackFridayTitle]}>🏷️ {blackFriday.title}</Text>
          <Text style={[type.footnote, styles.blackFridayText]}>{blackFriday.subtitle}</Text>
        </Touchable>
      )}


      {loading ? (
        <View style={styles.section}>
          <SectionHeader title="Comparaciones del día" />
          <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={styles.shelf} contentContainerStyle={styles.shelfRow}>
            <DealCardSkeleton />
            <DealCardSkeleton />
            <DealCardSkeleton />
          </ScrollView>
        </View>
      ) : error ? (
        <EmptyState icon="wifiSlash" title="Sin conexión con DóndeTa" message={error} actionTitle="Reintentar" onAction={() => void load()} />
      ) : (
        <>
          {comparisons.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Comparaciones del día" subtitle="El mismo producto, más barato en otra tienda" />
              <Shelf>
                {comparisons.map(entry => (
                  <DealCard
                    key={entry.product.id}
                    product={entry.product}
                    storeCount={entry.stores}
                    highlight={{ label: `Ahorras ${formatPrice(entry.savings)}` }}
                    onPress={() => openProduct(entry.product)}
                  />
                ))}
              </Shelf>
            </View>
          )}
          {drops.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Bajaron de precio" subtitle="Según nuestro historial de precios" />
              <Shelf>
                {drops.map(drop => (
                  <DealCard
                    key={drop.product.id}
                    product={drop.product}
                    highlight={{ label: `Bajó ${drop.pct}%`, wasPrice: drop.oldPrice }}
                    onPress={() => openProduct(drop.product)}
                  />
                ))}
              </Shelf>
            </View>
          )}
          {gaming.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Gaming"
                subtitle="Recargas y juegos digitales · Entrega inmediata"
                actionTitle="Ver todo"
                onAction={() => router.push('/gaming')}
              />
              <View style={styles.gamingIntro}>
                <EnebaBadge />
                <DiscountCode compact />
              </View>
              <Shelf>
                {gaming.map(product => (
                  <DealCard key={product.id} product={product} highlight={{ label: gamingKind(product) }} onPress={() => openProduct(product)} />
                ))}
              </Shelf>
            </View>
          )}
          {products.length > 0 && <SectionHeader title="Todos los productos" count={products.length} />}
        </>
      )}
    </View>
  )

  return (
    <>
      <Stack.Screen options={{ title: 'DóndeTa', headerLargeTitle: false, headerTitle: () => <BrandTitle /> }} />
      <FlatList
        data={loading || error ? [] : visible}
        keyExtractor={entry => (entry.kind === 'ad' ? entry.key : entry.item.id)}
        renderItem={({ item: entry }) =>
          entry.kind === 'ad' ? <NativeAdCard /> : <ProductCard product={entry.item} onPress={() => openProduct(entry.item)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={loading ? <View><ProductRowSkeleton /><ProductRowSkeleton /><ProductRowSkeleton /></View> : null}
        onEndReached={() => setVisibleCount(count => (count < sorted.length ? count + BATCH : count))}
        onEndReachedThreshold={0.6}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        style={styles.screen}
        initialNumToRender={8}
        windowSize={7}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
      />
    </>
  )
}

function Shelf({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.shelf}
      contentContainerStyle={styles.shelfRow}
      decelerationRate="fast"
      snapToInterval={176 + spacing.md}
      snapToAlignment="start"
    >
      {children}
    </ScrollView>
  )
}

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} feedback="scale" style={styles.quick} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.quickIcon}>
        <Icon name={icon} size={20} color={colors.primaryDark} weight="semibold" />
      </View>
      <Text style={[type.footnoteEmphasized, styles.quickLabel]} numberOfLines={1}>{label}</Text>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page },
  searchPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 40, borderRadius: 12, borderCurve: 'continuous',
    backgroundColor: colors.fill, paddingHorizontal: spacing.md, marginTop: spacing.xs, marginBottom: spacing.lg,
  },
  searchPillText: { color: colors.tertiaryLabel },
  hero: { backgroundColor: colors.primary, borderRadius: radii.xxl, borderCurve: 'continuous', padding: spacing.xl, marginBottom: spacing.md },
  heroEyebrow: { color: 'rgba(255,255,255,0.75)', letterSpacing: 1.2 },
  heroTitle: { color: '#fff', fontSize: 26, lineHeight: 32, marginTop: spacing.sm },
  heroText: { color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
  quick: { flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', paddingVertical: spacing.md, alignItems: 'center', gap: spacing.sm },
  quickIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.navy },
  blackFriday: { backgroundColor: colors.navy, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.lg, marginBottom: spacing.xxl, gap: 2 },
  blackFridayTitle: { color: '#FFD166' },
  blackFridayText: { color: 'rgba(255,255,255,0.8)' },
  section: { marginBottom: spacing.xxl },
  gamingIntro: { gap: spacing.sm, marginBottom: spacing.xs },
  // Bleed shelves to the screen edges so cards scroll under the page padding.
  shelf: { marginHorizontal: -spacing.lg },
  shelfRow: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
})
