import { StyleSheet, Text, View } from 'react-native'
import type { Product } from '../types'
import { getBestOffer } from '../domain/offers'
import { isGaming } from '../domain/gaming'
import { formatPrice } from '../domain/currency'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'
import { haptics } from '../design/haptics'
import ProductImage from './ProductImage'
import Icon from './Icon'
import Touchable from './ui/Touchable'
import { useAppState } from '../state/AppStateContext'

// A product in a list: photo, name, best price and where. Price alerts live
// on the product page; the card keeps a single quick action (favorite).
export default function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const offer = getBestOffer(product.prices)
  const { favoriteIds, toggleFavorite } = useAppState()
  const isFavorite = favoriteIds.has(product.id)
  const storeCount = new Set(product.prices.map(p => p.store)).size
  const detail = isGaming(product) ? product.subtitle : product.model || product.subtitle

  return (
    <Touchable
      onPress={onPress}
      feedback="scale"
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}${offer ? `, ${formatPrice(offer.price)} en ${offer.store}` : ''}`}
    >
      <View style={styles.imageTile}>
        <ProductImage uri={product.image} style={styles.image} />
      </View>
      <View style={styles.body}>
        {!!product.brand && <Text style={[type.caption2, styles.brand]} numberOfLines={1}>{product.brand.toUpperCase()}</Text>}
        <Text style={[type.subheadlineEmphasized, styles.name]} numberOfLines={2}>{product.name}</Text>
        {!!detail && <Text style={[type.caption, styles.detail]} numberOfLines={1}>{detail}</Text>}
        {offer ? (
          <View style={styles.priceBlock}>
            <Text style={[type.price(19), styles.price]}>{formatPrice(offer.price)}</Text>
            <Text style={[type.caption, styles.store]} numberOfLines={1}>
              {storeCount > 1 ? `Más barato en ${offer.store} · ${storeCount} tiendas` : `En ${offer.store}`}
            </Text>
          </View>
        ) : (
          <Text style={[type.footnote, styles.muted]}>Sin ofertas disponibles</Text>
        )}
      </View>
      <Touchable
        onPress={() => {
          haptics.selection()
          toggleFavorite(product.id)
        }}
        hitSlop={12}
        style={styles.favorite}
        accessibilityRole="button"
        accessibilityState={{ selected: isFavorite }}
        accessibilityLabel={isFavorite ? `Quitar ${product.name} de guardados` : `Guardar ${product.name}`}
      >
        <Icon name={isFavorite ? 'heartFill' : 'heart'} size={19} color={isFavorite ? colors.accent : colors.tertiaryLabel} />
      </Touchable>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageTile: { width: 84, height: 84, borderRadius: radii.md, borderCurve: 'continuous', backgroundColor: '#fff', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator, padding: 6 },
  image: { width: '100%', height: '100%' },
  body: { flex: 1, justifyContent: 'center' },
  brand: { color: colors.primaryDark, letterSpacing: 0.4 },
  name: { color: colors.navy, marginTop: 1 },
  detail: { color: colors.tertiaryLabel, marginTop: 1 },
  priceBlock: { marginTop: spacing.xs },
  price: { color: colors.navy },
  store: { color: colors.secondaryLabel },
  muted: { color: colors.tertiaryLabel, marginTop: spacing.sm },
  favorite: { alignSelf: 'flex-start', padding: 2 },
})
