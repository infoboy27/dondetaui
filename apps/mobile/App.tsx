import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { api, bestOffer, money, type Product } from './src/api'

type Screen = 'home' | 'results' | 'detail' | 'scanner'

const C = {
  teal: '#00B894',
  mint: '#E6F7F3',
  orange: '#FF9F1C',
  navy: '#0F1D2D',
  bg: '#F2F4F7',
  white: '#FFFFFF',
  muted: '#7B8FA5',
  border: '#E2E8F0',
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const offer = bestOffer(product)
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {!!product.image && <Image source={{ uri: product.image }} style={styles.productImage} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.subtitle}>{product.model || product.subtitle}</Text>
        {offer ? (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.price}>{money(offer.price)}</Text>
            <Text style={styles.store}>Más barato en {offer.store}</Text>
          </View>
        ) : <Text style={styles.muted}>Sin ofertas disponibles</Text>}
      </View>
    </Pressable>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      setProducts(await api.list())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el catálogo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadProducts() }, [])

  const search = async () => {
    const value = query.trim()
    if (!value) return
    setLoading(true)
    setError(null)
    setScreen('results')
    try {
      setProducts(await api.search(value))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar')
    } finally {
      setLoading(false)
    }
  }

  const openProduct = (product: Product) => {
    setSelected(product)
    setScreen('detail')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      {screen === 'scanner' ? (
        <Scanner onBack={() => setScreen('home')} onProduct={openProduct} />
      ) : (
        <View style={styles.app}>
          <View style={styles.header}>
            {screen !== 'home' && (
              <Pressable onPress={() => setScreen('home')} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.logo}>DóndeTa</Text>
              <Text style={styles.tagline}>¿Dónde ’ta más barato?</Text>
            </View>
            <Pressable onPress={() => setScreen('scanner')} style={styles.scanButton}><Text style={styles.scanIcon}>▦</Text></Pressable>
          </View>

          {screen === 'detail' && selected ? (
            <ProductDetail product={selected} />
          ) : (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {screen === 'home' && (
                <View style={styles.hero}>
                  <Text style={styles.heroEyebrow}>BUSCA · COMPARA · AHORRA</Text>
                  <Text style={styles.heroTitle}>Antes de comprar,{`\n`}mira DóndeTa.</Text>
                  <Text style={styles.heroText}>Compara precios de tiendas dominicanas en segundos.</Text>
                </View>
              )}

              <View style={styles.searchRow}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => void search()}
                  placeholder="Busca producto, marca o modelo"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  returnKeyType="search"
                />
                <Pressable onPress={() => void search()} style={styles.searchButton}><Text style={styles.searchButtonText}>Buscar</Text></Pressable>
              </View>

              {error && (
                <Pressable onPress={() => void loadProducts()} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Text style={styles.retry}>Toca para reintentar</Text>
                </Pressable>
              )}

              {loading ? (
                <ActivityIndicator size="large" color={C.teal} style={{ marginTop: 48 }} />
              ) : (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{screen === 'results' ? `Resultados para “${query}”` : 'Precios destacados'}</Text>
                    <Text style={styles.count}>{products.length}</Text>
                  </View>
                  {products.map(product => <ProductCard key={product.id} product={product} onPress={() => openProduct(product)} />)}
                  {!products.length && <Text style={styles.empty}>No encontramos productos.</Text>}
                </>
              )}
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

function ProductDetail({ product }: { product: Product }) {
  const offers = useMemo(() => [...product.prices].sort((a, b) => a.price - b.price), [product])
  const cheapest = offers[0]
  const mostExpensive = offers.at(-1)
  const savings = cheapest && mostExpensive ? Math.max(0, mostExpensive.price - cheapest.price) : 0

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.detailTop}>
        {!!product.image && <Image source={{ uri: product.image }} style={styles.detailImage} />}
        <Text style={styles.detailBrand}>{product.brand}</Text>
        <Text style={styles.detailTitle}>{product.name}</Text>
        <Text style={styles.subtitle}>{product.model}</Text>
      </View>
      {cheapest && (
        <View style={styles.bestBox}>
          <Text style={styles.bestLabel}>MEJOR PRECIO</Text>
          <Text style={styles.bestPrice}>{money(cheapest.price)}</Text>
          <Text style={styles.bestStore}>{cheapest.store} · {cheapest.shipping}</Text>
          {savings > 0 && <Text style={styles.savings}>Ahorras hasta {money(savings)}</Text>}
        </View>
      )}
      <Text style={styles.sectionTitle}>Comparación de tiendas</Text>
      {offers.map((offer, index) => (
        <View key={`${offer.store}-${index}`} style={styles.offerRow}>
          <View style={[styles.storeBadge, { backgroundColor: offer.color || C.teal }]}><Text style={styles.storeBadgeText}>{offer.abbr}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offerStore}>{offer.store}</Text>
            <Text style={styles.offerMeta}>{offer.available ? 'Disponible' : 'No disponible'} · {offer.shipping}</Text>
          </View>
          <Text style={styles.offerPrice}>{money(offer.price)}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

function Scanner({ onBack, onProduct }: { onBack: () => void; onProduct: (product: Product) => void }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [locked, setLocked] = useState(false)
  const [status, setStatus] = useState('Apunta al código EAN/UPC del producto')

  const scanned = async ({ data }: BarcodeScanningResult) => {
    if (locked) return
    setLocked(true)
    setStatus(`Buscando ${data}…`)
    try {
      const product = await api.barcode(data)
      onProduct(product)
    } catch {
      setStatus('Ese código aún no está en DóndeTa. Intenta otro producto.')
      setTimeout(() => setLocked(false), 1800)
    }
  }

  if (!permission) return <View style={styles.center}><ActivityIndicator color={C.teal} /></View>
  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.detailTitle}>Escáner DóndeTa</Text>
        <Text style={styles.heroText}>Necesitamos acceso a la cámara para leer códigos de barras.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.primary}><Text style={styles.primaryText}>Permitir cámara</Text></Pressable>
        <Pressable onPress={onBack}><Text style={styles.link}>Volver</Text></Pressable>
      </View>
    )
  }

  return (
    <View style={styles.cameraPage}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={locked ? undefined : scanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
      />
      <View style={styles.cameraOverlay}>
        <View style={styles.cameraTop}><Pressable onPress={onBack} style={styles.cameraBack}><Text style={styles.cameraBackText}>×</Text></Pressable><Text style={styles.cameraTitle}>Escanea el código de barras</Text></View>
        <View style={styles.scanFrame} />
        <View style={styles.scanStatus}><Text style={styles.scanStatusText}>{status}</Text></View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white }, app: { flex: 1, backgroundColor: C.bg },
  header: { minHeight: 76, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontSize: 24, fontWeight: '800', color: C.teal }, tagline: { fontSize: 12, color: C.muted, marginTop: 1 },
  scanButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }, scanIcon: { fontSize: 24, color: C.teal },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }, backText: { fontSize: 32, lineHeight: 32, color: C.navy },
  content: { padding: 18, paddingBottom: 42 }, hero: { backgroundColor: C.teal, borderRadius: 24, padding: 22, marginBottom: 18 },
  heroEyebrow: { color: '#BDF5E8', fontWeight: '800', fontSize: 11, letterSpacing: 1 }, heroTitle: { color: C.white, fontSize: 28, fontWeight: '800', lineHeight: 34, marginTop: 8 }, heroText: { color: '#52708B', fontSize: 14, lineHeight: 21, marginTop: 8 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 18 }, input: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 14, color: C.navy },
  searchButton: { height: 50, borderRadius: 14, backgroundColor: C.navy, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, searchButtonText: { color: C.white, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, sectionTitle: { fontSize: 17, fontWeight: '800', color: C.navy, marginVertical: 10 }, count: { backgroundColor: C.mint, color: C.teal, fontWeight: '800', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  card: { backgroundColor: C.white, borderRadius: 18, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', gap: 12 }, productImage: { width: 92, height: 92, borderRadius: 14, backgroundColor: '#F8FAFC' },
  brand: { color: C.teal, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }, productName: { color: C.navy, fontWeight: '800', fontSize: 15, lineHeight: 20, marginTop: 2 }, subtitle: { color: C.muted, fontSize: 12, marginTop: 3 }, price: { color: C.navy, fontWeight: '900', fontSize: 19 }, store: { color: C.teal, fontSize: 11, fontWeight: '700' }, muted: { color: C.muted, marginTop: 8 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 36 }, errorBox: { backgroundColor: '#FFF1F2', borderRadius: 14, padding: 12, marginBottom: 14 }, errorText: { color: '#BE123C', fontWeight: '700' }, retry: { color: '#BE123C', fontSize: 12, marginTop: 3 },
  detailTop: { alignItems: 'center', backgroundColor: C.white, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: C.border }, detailImage: { width: 210, height: 210, borderRadius: 20, backgroundColor: '#F8FAFC' }, detailBrand: { color: C.teal, fontWeight: '800', marginTop: 14 }, detailTitle: { color: C.navy, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  bestBox: { backgroundColor: C.mint, borderRadius: 20, padding: 18, marginTop: 14 }, bestLabel: { color: C.teal, fontSize: 11, fontWeight: '900', letterSpacing: 1 }, bestPrice: { color: C.navy, fontSize: 30, fontWeight: '900', marginTop: 4 }, bestStore: { color: '#41657E', marginTop: 2 }, savings: { color: C.orange, fontWeight: '800', marginTop: 8 },
  offerRow: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }, storeBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, storeBadgeText: { color: C.white, fontWeight: '900' }, offerStore: { color: C.navy, fontWeight: '800' }, offerMeta: { color: C.muted, fontSize: 11, marginTop: 2 }, offerPrice: { color: C.navy, fontSize: 16, fontWeight: '900' },
  permission: { flex: 1, backgroundColor: C.bg, padding: 28, justifyContent: 'center', alignItems: 'center' }, primary: { backgroundColor: C.teal, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14, marginTop: 20 }, primaryText: { color: C.white, fontWeight: '800' }, link: { color: C.teal, fontWeight: '700', marginTop: 18 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraPage: { flex: 1, backgroundColor: '#06121F' }, cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 20 }, cameraTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }, cameraBack: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }, cameraBackText: { color: C.white, fontSize: 30, lineHeight: 30 }, cameraTitle: { color: C.white, fontWeight: '800', fontSize: 16 }, scanFrame: { alignSelf: 'center', width: '82%', height: 180, borderRadius: 22, borderWidth: 3, borderColor: C.teal, backgroundColor: 'transparent' }, scanStatus: { backgroundColor: 'rgba(6,18,31,0.82)', borderRadius: 16, padding: 14, marginBottom: 28 }, scanStatusText: { color: C.white, textAlign: 'center', fontWeight: '700' },
})
