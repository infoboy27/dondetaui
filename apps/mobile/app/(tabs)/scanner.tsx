import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

export default function ScannerScreen() {
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const [locked, setLocked] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [status, setStatus] = useState('Apunta al código EAN/UPC del producto')

  const scanned = async ({ data }: BarcodeScanningResult) => {
    if (locked) return
    setLocked(true)
    setStatus(`Buscando ${data}…`)
    try {
      const product: Product = await productsApi.barcode(data)
      router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
      setTimeout(() => setLocked(false), 1500)
    } catch {
      setStatus('Ese código aún no está en DóndeTa. Intenta otro producto.')
      setTimeout(() => setLocked(false), 1800)
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Text style={styles.permissionTitle}>Escáner DóndeTa</Text>
        <Text style={styles.permissionText}>Necesitamos acceso a la cámara para leer códigos de barras.</Text>
        <Pressable onPress={() => void requestPermission()} style={styles.primary}>
          <Text style={styles.primaryText}>Permitir cámara</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.cameraPage}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={locked ? undefined : scanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.topRow}>
          <Text style={styles.cameraTitle}>Escanea el código de barras</Text>
          <Pressable
            onPress={() => setTorchOn(v => !v)}
            style={[styles.torchButton, torchOn && styles.torchButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={torchOn ? 'Apagar flash' : 'Encender flash'}
          >
            <Text style={styles.torchIcon}>⚡</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.scanFrame} />
        <View style={{ flex: 1 }} />
        <View style={styles.scanStatus}>
          <Text style={styles.scanStatusText}>{status}</Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permission: { flex: 1, backgroundColor: colors.background, padding: spacing.xxxl, justifyContent: 'center', alignItems: 'center' },
  permissionTitle: { fontSize: 20, fontFamily: fonts.display.extrabold, color: colors.navy },
  permissionText: { fontFamily: fonts.body.regular, color: colors.navy400, textAlign: 'center', marginTop: spacing.sm },
  primary: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.md, marginTop: spacing.xl },
  primaryText: { color: '#fff', fontFamily: fonts.body.bold },
  cameraPage: { flex: 1, backgroundColor: '#06121F' },
  overlay: { flex: 1, padding: spacing.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  cameraTitle: { color: '#fff', fontFamily: fonts.display.bold, fontSize: 16, flex: 1 },
  torchButton: { width: 40, height: 40, borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  torchButtonActive: { backgroundColor: colors.yellow },
  torchIcon: { fontSize: 18 },
  scanFrame: { alignSelf: 'center', width: '82%', height: 180, borderRadius: radii.xxl, borderWidth: 3, borderColor: colors.primary },
  scanStatus: { backgroundColor: 'rgba(6,18,31,0.82)', borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.xxl },
  scanStatusText: { color: '#fff', fontFamily: fonts.body.bold, textAlign: 'center' },
})
