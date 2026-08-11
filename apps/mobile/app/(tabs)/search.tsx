import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import ProductCard from '../../src/components/ProductCard'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

export default function SearchScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const search = async (term = query) => {
    const value = term.trim()
    if (!value) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      setProducts(await productsApi.search(value))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar')
    } finally {
      setLoading(false)
    }
  }

  const openProduct = (product: Product) => {
    router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void search()}
            placeholder="Busca producto, marca o modelo"
            placeholderTextColor={colors.navy400}
            style={styles.input}
            returnKeyType="search"
          />
          <Pressable onPress={() => void search()} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Buscar</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error && (
          <Pressable onPress={() => void search()} style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retry}>Toca para reintentar</Text>
          </Pressable>
        )}
        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />}
        {!loading && searched && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resultados para "{query}"</Text>
              <Text style={styles.count}>{products.length}</Text>
            </View>
            {products.map(product => (
              <ProductCard key={product.id} product={product} onPress={() => openProduct(product)} />
            ))}
            {!products.length && <Text style={styles.empty}>No encontramos productos.</Text>}
          </>
        )}
        {!loading && !searched && <Text style={styles.hint}>Escribe algo para comparar precios.</Text>}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 20, fontFamily: fonts.display.extrabold, color: colors.navy, marginBottom: spacing.md },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, height: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: spacing.md, color: colors.navy, fontFamily: fonts.body.regular },
  searchButton: { height: 48, borderRadius: radii.md, backgroundColor: colors.navy, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  searchButtonText: { color: '#fff', fontFamily: fonts.body.bold },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl + spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontFamily: fonts.display.extrabold, color: colors.navy },
  count: { backgroundColor: colors.primaryLight, color: colors.primary, fontFamily: fonts.display.extrabold, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.full },
  empty: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
  errorBox: { backgroundColor: '#FFF1F2', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg },
  errorText: { color: '#BE123C', fontFamily: fonts.body.bold },
  retry: { color: '#BE123C', fontFamily: fonts.body.regular, fontSize: 12 },
  hint: { textAlign: 'center', color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.xxxl },
})
