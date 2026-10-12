import { useRef, useState } from 'react'
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Linking, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import { useIsFocused, useRouter } from 'expo-router'
import type { Product } from '../../src/types'
import { productsApi } from '../../src/api/products'
import { ApiError } from '../../src/api/http'
import { friendlyError } from '../../src/api/errors'
import Icon from '../../src/components/Icon'
import Button from '../../src/components/ui/Button'
import EmptyState from '../../src/components/ui/EmptyState'
import Touchable from '../../src/components/ui/Touchable'
import { colors, radii, spacing } from '../../src/design/tokens'
import { type } from '../../src/design/type'
import { haptics } from '../../src/design/haptics'

const HINT = 'Apunta al código de barras del producto'

export default function ScannerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  // Only run the camera while this tab is on screen.
  const focused = useIsFocused()
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraFailed, setCameraFailed] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ text: string; tone: 'hint' | 'warn' }>({ text: HINT, tone: 'hint' })
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const locked = useRef(false)

  const lookup = async (raw: string) => {
    const value = raw.trim()
    if (!value || locked.current) return
    locked.current = true
    setBusy(true)
    setStatus({ text: `Buscando ${value}…`, tone: 'hint' })
    try {
      const product: Product = await productsApi.barcode(value)
      haptics.success()
      setStatus({ text: HINT, tone: 'hint' })
      setManual(false)
      setCode('')
      router.push(`/product/${encodeURIComponent(product.slug ?? product.id)}`)
    } catch (e) {
      haptics.warning()
      const notFound = e instanceof ApiError && e.status === 404
      setStatus({
        text: notFound ? `El código ${value} aún no está en DóndeTa. Prueba con otro producto.` : friendlyError(e, 'No pudimos buscar ese código.'),
        tone: 'warn',
      })
    } finally {
      setBusy(false)
      // Short pause so the same barcode isn't read again immediately.
      setTimeout(() => { locked.current = false }, 1500)
    }
  }

  const onScanned = ({ data }: BarcodeScanningResult) => void lookup(data)

  if (!permission) {
    return <View style={[styles.fill, styles.center]}><ActivityIndicator color={colors.primary} /></View>
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center, styles.light, { paddingTop: insets.top }]}>
        <EmptyState
          icon="scan"
          tone="brand"
          title="Escanea y compara"
          message="Apunta la cámara al código de barras de un producto en la tienda y te mostramos dónde está más barato."
          actionTitle={permission.canAskAgain ? 'Permitir cámara' : 'Abrir Ajustes'}
          onAction={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
          secondaryTitle="Escribir el código"
          onSecondary={() => setManual(true)}
        />
        {manual && <ManualEntry code={code} setCode={setCode} busy={busy} onSubmit={() => void lookup(code)} onClose={() => setManual(false)} light />}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.fill, styles.dark]}>
      {focused && !cameraFailed && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          active={focused}
          enableTorch={torchOn}
          onBarcodeScanned={busy ? undefined : onScanned}
          onMountError={() => setCameraFailed(true)}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        />
      )}

      <View style={[styles.overlay, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 72 }]}>
        <View style={styles.topRow}>
          <Text style={[type.title2, styles.onDark]}>Escanear</Text>
          {!cameraFailed && (
            <Touchable
              onPress={() => { haptics.selection(); setTorchOn(v => !v) }}
              style={[styles.roundButton, torchOn && styles.roundButtonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: torchOn }}
              accessibilityLabel={torchOn ? 'Apagar linterna' : 'Encender linterna'}
            >
              <Icon name={torchOn ? 'flashOn' : 'flash'} size={18} color={torchOn ? colors.navy : '#fff'} />
            </Touchable>
          )}
        </View>

        {cameraFailed ? (
          <View style={[styles.cameraOff]}>
            <Icon name="scan" size={44} color="rgba(255,255,255,0.6)" weight="light" />
            <Text style={[type.title3, styles.onDark, styles.centerText]}>Cámara no disponible</Text>
            <Text style={[type.subheadline, styles.onDarkMuted, styles.centerText]}>
              No pudimos abrir la cámara en este dispositivo. Puedes escribir el código de barras a mano.
            </Text>
          </View>
        ) : (
          <View style={styles.viewfinder} pointerEvents="none">
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
        )}

        <View style={styles.bottom}>
          {manual ? (
            <ManualEntry code={code} setCode={setCode} busy={busy} onSubmit={() => void lookup(code)} onClose={() => { Keyboard.dismiss(); setManual(false) }} />
          ) : (
            <>
              <View style={[styles.status, status.tone === 'warn' && styles.statusWarn]}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Icon name={status.tone === 'warn' ? 'exclamation' : 'scan'} size={15} color="#fff" />}
                <Text style={[type.footnoteEmphasized, styles.onDark, { flexShrink: 1 }]}>{status.text}</Text>
              </View>
              <Touchable onPress={() => setManual(true)} style={styles.manualLink} accessibilityRole="button">
                <Icon name="keyboard" size={15} color="#fff" />
                <Text style={[type.subheadlineEmphasized, styles.onDark]}>Escribir el código</Text>
              </Touchable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

function ManualEntry({ code, setCode, busy, onSubmit, onClose, light = false }: {
  code: string
  setCode: (code: string) => void
  busy: boolean
  onSubmit: () => void
  onClose: () => void
  light?: boolean
}) {
  return (
    <View style={[styles.manualCard, light && styles.manualCardLight]}>
      <View style={styles.manualHeader}>
        <Text style={[type.headline, { color: colors.navy }]}>Código de barras</Text>
        <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
          <Icon name="closeCircle" size={22} color={colors.tertiaryLabel} />
        </Touchable>
      </View>
      <TextInput
        value={code}
        onChangeText={text => setCode(text.replace(/\D/g, ''))}
        placeholder="Ej. 7501234567890"
        placeholderTextColor={colors.tertiaryLabel}
        keyboardType="number-pad"
        maxLength={14}
        autoFocus
        style={[type.price(22, 'semibold'), styles.manualInput]}
        accessibilityLabel="Número del código de barras"
      />
      <Button title="Buscar producto" onPress={onSubmit} loading={busy} disabled={code.length < 8} />
    </View>
  )
}

const CORNER = 34
const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  light: { backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  dark: { backgroundColor: '#05101C' },
  overlay: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  onDark: { color: '#fff' },
  onDarkMuted: { color: 'rgba(255,255,255,0.7)' },
  centerText: { textAlign: 'center' },
  roundButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  roundButtonActive: { backgroundColor: colors.yellow },
  viewfinder: { alignSelf: 'center', width: '84%', aspectRatio: 1.7 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  cameraOff: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl },
  bottom: { gap: spacing.md, alignItems: 'center' },
  status: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch', justifyContent: 'center',
    backgroundColor: 'rgba(5,16,28,0.72)', borderRadius: radii.lg, borderCurve: 'continuous', paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  statusWarn: { backgroundColor: 'rgba(196,96,0,0.85)' },
  manualLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  manualCard: { alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.lg, gap: spacing.md },
  manualCardLight: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.page * 2 },
  manualHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  manualInput: { backgroundColor: colors.fill, borderRadius: radii.md, borderCurve: 'continuous', paddingHorizontal: spacing.lg, minHeight: 52, color: colors.navy, letterSpacing: 1 },
})
