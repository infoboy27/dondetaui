import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { ENEBA_DISCOUNT_CODE } from '../domain/gaming'
import { colors, radii, spacing } from '../design/tokens'
import { fonts } from '../design/fonts'

// The Eneba affiliate code (5% off), same as the web's DiscountCode. Their
// logo, where it appears, is EnebaBadge (approved by Eneba); new brand
// placements need their approval.
export default function DiscountCode({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(ENEBA_DISCOUNT_CODE)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable: the code is on screen anyway.
    }
  }

  return (
    <View style={[styles.box, compact && styles.compact]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>5% de descuento en Eneba con el código</Text>
        <Text style={styles.code} selectable>{ENEBA_DISCOUNT_CODE.toUpperCase()}</Text>
      </View>
      <Pressable onPress={() => void copy()} style={styles.button} accessibilityRole="button" accessibilityLabel={`Copiar el código ${ENEBA_DISCOUNT_CODE.toUpperCase()}`}>
        <Text style={styles.buttonText}>{copied ? '¡Copiado!' : 'Copiar'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primaryLight, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary,
    borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14,
  },
  compact: { paddingVertical: 10, paddingHorizontal: 12 },
  label: { fontSize: 12, color: colors.navy, fontFamily: fonts.body.regular },
  code: { fontSize: 18, color: colors.navy, fontFamily: fonts.display.bold, letterSpacing: 0.7 },
  button: { backgroundColor: colors.primary, borderRadius: radii.full, paddingVertical: 8, paddingHorizontal: 14 },
  buttonText: { color: '#fff', fontSize: 12, fontFamily: fonts.display.bold },
})
