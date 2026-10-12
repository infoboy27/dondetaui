import { StyleSheet, Text, View } from 'react-native'
import type { Product } from '../types'
import { getBestOffer } from '../domain/offers'
import { formatPrice } from '../domain/currency'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'
import ProductImage from './ProductImage'
import StoreLogo from './StoreLogo'
import Touchable from './ui/Touchable'

// Mirrors the web app's DealCard (src/components/DealCard.tsx): the home card
// for "Comparaciones del día" / "Bajaron de precio", leading with why the
// product is worth a look (the orange pill) and where it's cheapest.
export default function DealCard({ product, onPress, highlight, storeCount }: {
  product: Product
  onPress: () => void
  highlight: { label: string; wasPrice?: number }
  storeCount?: number
}) {
  const best = getBestOffer(product.prices)
  const multiStore = new Set(product.prices.map(offer => offer.store)).size > 1

  return (
    <Touchable onPress={onPress} feedback="scale" style={styles.card} accessibilityRole="button" accessibilityLabel={`${product.name}, ${highlight.label}`}>
      <View style={styles.imageBox}>
        <ProductImage uri={product.image} style={styles.image} />
        <View style={styles.pill}>
          <Text style={[type.captionEmphasized, styles.pillText]}>{highlight.label}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={[type.footnote, styles.name]} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={[type.price(18), styles.price]}>{best ? formatPrice(best.price) : 'Sin precio'}</Text>
          {!!highlight.wasPrice && !!best && highlight.wasPrice > best.price && (
            <Text style={[type.caption, styles.was]}>{formatPrice(Math.round(highlight.wasPrice))}</Text>
          )}
        </View>
        {best && (
          <View style={styles.storeRow}>
            <StoreLogo abbr={best.abbr} color={best.color} size={18} />
            <Text style={[type.caption, styles.muted]} numberOfLines={1}>
              {multiStore ? `${best.store}${storeCount && storeCount > 1 ? ` · ${storeCount} tiendas` : ''}` : best.store}
            </Text>
          </View>
        )}
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  card: { width: 176, backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', overflow: 'hidden' },
  imageBox: { height: 128, backgroundColor: '#fff', padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  image: { width: '100%', height: '100%' },
  pill: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { color: '#fff', fontSize: 11, lineHeight: 14 },
  body: { padding: spacing.md, gap: 4, flex: 1 },
  name: { color: colors.navy, minHeight: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  price: { color: colors.navy },
  was: { color: colors.tertiaryLabel, textDecorationLine: 'line-through' },
  muted: { color: colors.secondaryLabel, flexShrink: 1 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 2 },
})
