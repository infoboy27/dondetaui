import { useEffect, useState } from 'react'
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import { friendlyError } from '../../src/api/errors'
import { rankOffers, getBestOffer, getSavingsRange } from '../../src/domain/offers'
import { isGaming } from '../../src/domain/gaming'
import { offerUrl, openInApp, productWebUrl } from '../../src/domain/links'
import DiscountCode from '../../src/components/DiscountCode'
import { formatPrice } from '../../src/domain/currency'
import { colors, radii, spacing } from '../../src/design/tokens'
import { type } from '../../src/design/type'
import { haptics } from '../../src/design/haptics'
import ProductImage from '../../src/components/ProductImage'
import ProductReviews from '../../src/components/ProductReviews'
import StoreLogo from '../../src/components/StoreLogo'
import Icon, { type IconName } from '../../src/components/Icon'
import Button from '../../src/components/ui/Button'
import EmptyState from '../../src/components/ui/EmptyState'
import Touchable from '../../src/components/ui/Touchable'
import { Skeleton } from '../../src/components/ui/Skeleton'
import { useAppState } from '../../src/state/AppStateContext'
import { STORE_SLUGS } from '../../src/data/storeSlugs'

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { favoriteIds, toggleFavorite, alertedIds, toggleAlert } = useAppState()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

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
        if (!cancelled) setError(friendlyError(e, 'No encontramos este producto. Puede que ya no esté disponible.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug, attempt])

  if (loading) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
        <Skeleton width="100%" height={260} radius={radii.xxl} />
        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          <Skeleton width="30%" height={12} />
          <Skeleton width="95%" height={22} />
          <Skeleton width="70%" height={22} />
        </View>
        <Skeleton width="100%" height={120} radius={radii.xl} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    )
  }

  if (error || !product) {
    return (
      <View style={[styles.screen, styles.center]}>
        <EmptyState
          icon="shippingbox"
          title="No se pudo abrir el producto"
          message={error ?? undefined}
          actionTitle="Reintentar"
          onAction={() => setAttempt(n => n + 1)}
          secondaryTitle="Volver"
          onSecondary={() => router.back()}
        />
      </View>
    )
  }

  const offers = rankOffers(product.prices)
  const cheapest = getBestOffer(product.prices)
  const savings = getSavingsRange(product.prices)
  const gaming = isGaming(product)
  const singleStore = new Set(product.prices.map(offer => offer.store)).size === 1
  const isFavorite = favoriteIds.has(product.id)
  const isAlerted = alertedIds.has(product.id)
  const cheapestUrl = cheapest ? offerUrl(product, cheapest) : null

  const share = () => {
    void Share.share({
      message: cheapest
        ? `${product.name} desde ${formatPrice(cheapest.price)} en DóndeTa`
        : `${product.name} en DóndeTa`,
      url: productWebUrl(product),
    }).catch(() => {})
  }

  const onToggleAlert = () => {
    if (!toggleAlert(product.id)) {
      router.navigate('/profile')
      return
    }
    haptics.success()
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <HeaderButton icon="share" label="Compartir" onPress={share} />
              <HeaderButton
                icon={isAlerted ? 'bellFill' : 'bell'}
                label={isAlerted ? 'Quitar alerta de precio' : 'Avisarme si baja de precio'}
                active={isAlerted}
                onPress={onToggleAlert}
              />
              <HeaderButton
                icon={isFavorite ? 'heartFill' : 'heart'}
                label={isFavorite ? 'Quitar de guardados' : 'Guardar'}
                active={isFavorite}
                activeColor={colors.accent}
                onPress={() => {
                  haptics.selection()
                  toggleFavorite(product.id)
                }}
              />
            </View>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.imageCard}>
          <ProductImage uri={product.image} style={styles.image} />
        </View>

        <View style={styles.titleBlock}>
          {!!product.brand && <Text style={[type.footnoteEmphasized, styles.brand]}>{product.brand}</Text>}
          <Text style={[type.title2, styles.title]} accessibilityRole="header">{product.name}</Text>
          {gaming
            ? <Text style={[type.subheadline, styles.subtitle]}>Código digital · Entrega inmediata</Text>
            : !!product.model && <Text style={[type.subheadline, styles.subtitle]}>Modelo {product.model}</Text>}
        </View>

        {cheapest && (
          <View style={styles.bestCard}>
            <View style={styles.bestTop}>
              <View style={{ flex: 1 }}>
                <Text style={[type.caption2, styles.bestLabel]}>{singleStore ? 'PRECIO' : 'MEJOR PRECIO'}</Text>
                <Text style={[type.price(34, 'bold'), styles.bestPrice]} adjustsFontSizeToFit numberOfLines={1}>{formatPrice(cheapest.price)}</Text>
                <Text style={[type.subheadline, styles.bestStore]}>
                  en {cheapest.store} · {gaming ? 'entrega inmediata' : cheapest.shipping}
                </Text>
              </View>
              <StoreLogo abbr={cheapest.abbr} color={cheapest.color} size={48} />
            </View>
            {savings > 0 && (
              <View style={styles.savings}>
                <Icon name="tag" size={13} color={colors.accent} />
                <Text style={[type.footnoteEmphasized, styles.savingsText]}>Ahorras hasta {formatPrice(savings)} frente a otras tiendas</Text>
              </View>
            )}
            {cheapestUrl && (
              <Button title={`Ver en ${cheapest.store}`} icon="arrowUpRight" onPress={() => openInApp(cheapestUrl)} style={{ marginTop: spacing.md }} />
            )}
          </View>
        )}

        {gaming && (
          <View style={styles.gamingBox}>
            <DiscountCode />
            <Note icon="bolt" text="Producto digital: el código llega a tu correo al instante." />
            <Note icon="checkmarkCircle" text="Región global: se activa desde tu país." />
            <Note icon="storefront" text="La compra se hace en Eneba; DóndeTa no vende ni cobra." />
          </View>
        )}

        <Text style={[type.title3, styles.sectionTitle]}>{singleStore ? 'Disponible en' : `Precios en ${offers.length} tiendas`}</Text>
        <View style={styles.offers}>
          {offers.map((offer, index) => {
            const url = offerUrl(product, offer)
            const storeSlug = STORE_SLUGS[offer.abbr]
            const isBest = index === 0 && !singleStore
            return (
              <View key={`${offer.store}-${index}`}>
                <Touchable
                  onPress={() => url && openInApp(url)}
                  disabled={!url}
                  style={styles.offerRow}
                  accessibilityRole="link"
                  accessibilityLabel={`${offer.store}, ${formatPrice(offer.price)}${offer.available ? '' : ', no disponible'}. Ver oferta`}
                >
                  <Touchable
                    onPress={() => storeSlug && router.push(`/store/${storeSlug}`)}
                    disabled={!storeSlug}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver tienda ${offer.store}`}
                  >
                    <StoreLogo abbr={offer.abbr} color={offer.color || colors.primary} size={40} />
                  </Touchable>
                  <View style={{ flex: 1 }}>
                    <View style={styles.offerNameRow}>
                      <Text style={[type.headline, styles.offerStore]} numberOfLines={1}>{offer.store}</Text>
                      {isBest && <Text style={[type.caption2, styles.bestTag]}>MÁS BARATO</Text>}
                    </View>
                    <Text style={[type.footnote, offer.available ? styles.offerMeta : styles.offerUnavailable]} numberOfLines={1}>
                      {offer.available ? 'Disponible' : 'No disponible'} · {offer.shipping}
                    </Text>
                  </View>
                  <View style={styles.offerRight}>
                    <Text style={[type.price(17, 'semibold'), isBest ? styles.offerPriceBest : styles.offerPrice]}>{formatPrice(offer.price)}</Text>
                    {!!url && <Icon name="arrowUpRight" size={12} color={colors.tertiaryLabel} weight="semibold" />}
                  </View>
                </Touchable>
                {index < offers.length - 1 && <View style={styles.separator} />}
              </View>
            )
          })}
        </View>

        <ProductReviews productId={product.id} />
      </ScrollView>
    </>
  )
}

function HeaderButton({ icon, label, onPress, active = false, activeColor = colors.primary }: {
  icon: IconName
  label: string
  onPress: () => void
  active?: boolean
  activeColor?: string
}) {
  return (
    <Touchable onPress={onPress} hitSlop={8} style={styles.headerButton} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}>
      <Icon name={icon} size={20} color={active ? activeColor : colors.navy} />
    </Touchable>
  )
}

function Note({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.note}>
      <Icon name={icon} size={14} color={colors.primaryDark} />
      <Text style={[type.footnote, styles.noteText]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.page },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xs },
  headerButton: { padding: 2 },
  imageCard: { backgroundColor: '#fff', borderRadius: radii.xxl, borderCurve: 'continuous', padding: spacing.xl, alignItems: 'center' },
  image: { width: '100%', height: 240 },
  titleBlock: { marginTop: spacing.xl, gap: 4 },
  brand: { color: colors.primaryDark },
  title: { color: colors.navy },
  subtitle: { color: colors.secondaryLabel },
  bestCard: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.lg, marginTop: spacing.xl },
  bestTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bestLabel: { color: colors.primaryDark, letterSpacing: 0.8 },
  bestPrice: { color: colors.navy, marginTop: 2 },
  bestStore: { color: colors.secondaryLabel },
  savings: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accentLight, borderRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md },
  savingsText: { color: '#B86400', flexShrink: 1 },
  gamingBox: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.lg, gap: spacing.sm, marginTop: spacing.md },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  noteText: { color: colors.secondaryLabel, flex: 1 },
  sectionTitle: { color: colors.navy, marginTop: spacing.xxl, marginBottom: spacing.md },
  offers: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', overflow: 'hidden' },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  offerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  offerStore: { color: colors.navy, flexShrink: 1 },
  bestTag: { color: colors.primaryDark, backgroundColor: colors.primaryLight, borderRadius: 4, overflow: 'hidden', paddingHorizontal: 5, paddingVertical: 1, letterSpacing: 0.4 },
  offerMeta: { color: colors.secondaryLabel },
  offerUnavailable: { color: colors.tertiaryLabel },
  offerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerPrice: { color: colors.navy },
  offerPriceBest: { color: colors.primaryDark },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 72 },
})
