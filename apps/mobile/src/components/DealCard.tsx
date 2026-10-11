import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Product } from '../types'
import { getBestOffer } from '../domain/offers'
import { formatPrice } from '../domain/currency'
import { colors, radii, spacing } from '../design/tokens'
import { fonts } from '../design/fonts'
import { shadows } from '../design/shadows'
import ProductImage from './ProductImage'
import StoreLogo from './StoreLogo'

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

  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel={`${product.name}, ${highlight.label}`}>
      <View style={styles.imageBox}>
        <ProductImage uri={product.image} style={styles.image} />
        <Text style={styles.pill}>{highlight.label}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{best ? formatPrice(best.price) : 'Sin precio'}</Text>
          {!!highlight.wasPrice && !!best && highlight.wasPrice > best.price && (
            <Text style={styles.was}>{formatPrice(Math.round(highlight.wasPrice))}</Text>
          )}
        </View>
        {!!storeCount && storeCount > 1 && <Text style={styles.muted}>Comparado en {storeCount} tiendas</Text>}
        {best && (
          <View style={styles.storeRow}>
            <StoreLogo abbr={best.abbr} color={best.color} size={20} />
            <Text style={styles.muted} numberOfLines={1}>Más barato en {best.store}</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { width: 190, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.sm },
  imageBox: { height: 120, backgroundColor: '#F8FAFC' },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
  pill: {
    position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: colors.accent, color: '#fff',
    fontFamily: fonts.display.bold, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full, overflow: 'hidden',
  },
  body: { padding: spacing.md, gap: 6, flex: 1 },
  name: { color: colors.navy, fontFamily: fonts.body.medium, fontSize: 13, lineHeight: 17, minHeight: 34 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  price: { color: colors.primary, fontFamily: fonts.display.bold, fontSize: 18 },
  was: { color: '#9AAABB', fontFamily: fonts.body.regular, fontSize: 11, textDecorationLine: 'line-through' },
  muted: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 11, flexShrink: 1 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto' },
})
