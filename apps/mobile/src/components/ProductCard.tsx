import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Product } from '../types'
import { getBestOffer } from '../domain/offers'
import { formatPrice } from '../domain/currency'
import { colors, radii, spacing } from '../design/tokens'
import { fonts } from '../design/fonts'
import { shadows } from '../design/shadows'
import ProductImage from './ProductImage'
import { useAppState } from '../state/AppStateContext'

export default function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const router = useRouter()
  const offer = getBestOffer(product.prices)
  const { favoriteIds, toggleFavorite, alertedIds, toggleAlert } = useAppState()
  const isFavorite = favoriteIds.has(product.id)
  const isAlerted = alertedIds.has(product.id)

  const onToggleAlert = () => {
    if (!toggleAlert(product.id)) router.push('/(tabs)/profile')
  }

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ProductImage uri={product.image} style={styles.image} />
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>{product.brand}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onToggleAlert}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isAlerted ? `Quitar alerta de ${product.name}` : `Crear alerta para ${product.name}`}
            >
              <Text style={[styles.bell, isAlerted && styles.bellActive]}>🔔</Text>
            </Pressable>
            <Pressable
              onPress={() => toggleFavorite(product.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
            >
              <Text style={[styles.heart, isFavorite && styles.heartActive]}>{isFavorite ? '♥' : '♡'}</Text>
            </Pressable>
          </View>
        </View>
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  bell: { fontSize: 15, opacity: 0.35 },
  bellActive: { opacity: 1 },
  heart: { fontSize: 18, color: colors.navy400 },
  heartActive: { color: colors.accent },
  brand: { color: colors.primary, fontFamily: fonts.display.bold, fontSize: 11 },
  name: { color: colors.navy, fontFamily: fonts.display.bold, fontSize: 15, lineHeight: 20, marginTop: 2 },
  subtitle: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 12, marginTop: 3 },
  price: { color: colors.navy, fontFamily: fonts.display.black, fontSize: 19 },
  store: { color: colors.primary, fontFamily: fonts.body.medium, fontSize: 11 },
  muted: { color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.sm },
})
