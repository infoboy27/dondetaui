import { StyleSheet, View } from 'react-native'
import type { Product } from '../types'
import { spacing } from '../design/tokens'
import ProductCard from './ProductCard'

// One row of the product grid. With one column it renders the plain card,
// exactly the phone layout; a short last row keeps cells the same width.
export default function ProductGridRow({ items, columns, onPress }: { items: Product[]; columns: number; onPress: (product: Product) => void }) {
  if (columns <= 1) {
    const [product] = items
    return product ? <ProductCard product={product} onPress={() => onPress(product)} /> : null
  }
  return (
    <View style={styles.row}>
      {Array.from({ length: columns }, (_, index) => {
        const product = items[index]
        return (
          <View key={product?.id ?? `empty-${index}`} style={styles.cell}>
            {product && <ProductCard product={product} onPress={() => onPress(product)} />}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
})
