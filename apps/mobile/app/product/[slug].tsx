import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import { rankOffers, getBestOffer, getSavingsRange } from '../../src/domain/offers'
import { formatPrice } from '../../src/domain/currency'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'
import { shadows } from '../../src/design/shadows'
import ProductImage from '../../src/components/ProductImage'
import ProductReviews from '../../src/components/ProductReviews'
import { useAppState } from '../../src/state/AppStateContext'

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { favoriteIds, toggleFavorite, alertedIds, toggleAlert } = useAppState()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        let result: Product
        try {
          result = await productsApi.getBySlug(slug)
        } catch {
          result = await productsApi.get(slug)
        }
        if (!cancelled) setProduct(result)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el producto')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Producto no encontrado'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  const offers = rankOffers(product.prices)
  const cheapest = getBestOffer(product.prices)
  const savings = getSavingsRange(product.prices)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => { if (!toggleAlert(product.id)) router.push('/(tabs)/profile') }}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={alertedIds.has(product.id) ? `Quitar alerta de ${product.name}` : `Crear alerta para ${product.name}`}
        >
          <Text style={[styles.bell, alertedIds.has(product.id) && styles.bellActive]}>🔔</Text>
        </Pressable>
        <Pressable
          onPress={() => toggleFavorite(product.id)}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={favoriteIds.has(product.id) ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
        >
          <Text style={[styles.heart, favoriteIds.has(product.id) && styles.heartActive]}>
            {favoriteIds.has(product.id) ? '♥' : '♡'}
          </Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <ProductImage uri={product.image} style={styles.image} />
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.title}>{product.name}</Text>
          {!!product.model && <Text style={styles.subtitle}>{product.model}</Text>}
        </View>

        {cheapest && (
          <View style={styles.bestBox}>
            <Text style={styles.bestLabel}>MEJOR PRECIO</Text>
            <Text style={styles.bestPrice}>{formatPrice(cheapest.price)}</Text>
            <Text style={styles.bestStore}>{cheapest.store} · {cheapest.shipping}</Text>
            {savings > 0 && <Text style={styles.savings}>Ahorras hasta {formatPrice(savings)}</Text>}
          </View>
        )}

        <Text style={styles.sectionTitle}>Comparación de tiendas</Text>
        {offers.map((offer, index) => (
          <View key={`${offer.store}-${index}`} style={styles.offerRow}>
            <View style={[styles.storeBadge, { backgroundColor: offer.color || colors.primary }]}>
              <Text style={styles.storeBadgeText}>{offer.abbr}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.offerStore}>{offer.store}</Text>
              <Text style={styles.offerMeta}>{offer.available ? 'Disponible' : 'No disponible'} · {offer.shipping}</Text>
            </View>
            <Text style={styles.offerPrice}>{formatPrice(offer.price)}</Text>
          </View>
        ))}

        <ProductReviews productId={product.id} />
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
  heart: { fontSize: 18, color: colors.navy400 },
  heartActive: { color: colors.accent },
  bell: { fontSize: 16, opacity: 0.35 },
  bellActive: { opacity: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  top: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xxl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  image: { width: 200, height: 200, borderRadius: radii.xl },
  brand: { color: colors.primary, fontFamily: fonts.display.bold, marginTop: spacing.md },
  title: { color: colors.navy, fontSize: 20, fontFamily: fonts.display.black, textAlign: 'center', marginTop: spacing.xs },
  subtitle: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 12, marginTop: spacing.xs },
  bestBox: { backgroundColor: colors.primaryLight, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg },
  bestLabel: { color: colors.primary, fontSize: 11, fontFamily: fonts.display.black },
  bestPrice: { color: colors.navy, fontSize: 30, fontFamily: fonts.display.black },
  bestStore: { color: colors.navy400, fontFamily: fonts.body.regular },
  savings: { color: colors.accent, fontFamily: fonts.display.bold, marginTop: spacing.sm },
  sectionTitle: { fontSize: 17, fontFamily: fonts.display.extrabold, color: colors.navy, marginVertical: spacing.md },
  offerRow: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md, ...shadows.sm },
  storeBadge: { width: 40, height: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  storeBadgeText: { color: '#fff', fontFamily: fonts.display.black },
  offerStore: { color: colors.navy, fontFamily: fonts.display.bold },
  offerMeta: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 11 },
  offerPrice: { color: colors.navy, fontSize: 16, fontFamily: fonts.display.black },
  errorText: { color: '#BE123C', fontFamily: fonts.body.bold },
  backLink: { marginTop: spacing.md },
  backLinkText: { color: colors.primary, fontFamily: fonts.body.bold },
})
