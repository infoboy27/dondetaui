import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Product } from '../types'
import { getBestOffer } from '../domain/offers'
import { formatPrice } from '../domain/currency'
import { colors, radii, spacing } from '../design/tokens'
import { fonts } from '../design/fonts'
import { shadows } from '../design/shadows'
import ProductImage from './ProductImage'

export default function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const offer = getBestOffer(product.prices)

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ProductImage uri={product.image} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.subtitle}>{product.model || product.subtitle}</Text>
        {offer ? (
          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.price}>{formatPrice(offer.price)}</Text>
            <Text style={styles.store}>Más barato en {offer.store}</Text>
          </View>
        ) : (
          <Text style={styles.muted}>Sin ofertas disponibles</Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadows.sm,
  },
  image: { width: 92, height: 92, borderRadius: radii.md, backgroundColor: colors.navy50 },
  brand: { color: colors.primary, fontFamily: fonts.display.bold, fontSize: 11 },
  name: { color: colors.navy, fontFamily: fonts.display.bold, fontSize: 15, lineHeight: 20, marginTop: 2 },
  subtitle: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 12, marginTop: 3 },
  price: { color: colors.navy, fontFamily: fonts.display.black, fontSize: 19 },
  store: { color: colors.primary, fontFamily: fonts.body.medium, fontSize: 11 },
  muted: { color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.sm },
})
