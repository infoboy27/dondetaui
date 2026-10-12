import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { ENEBA_DISCOUNT_CODE } from '../domain/gaming'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'
import { haptics } from '../design/haptics'
import Icon from './Icon'
import Touchable from './ui/Touchable'

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
      haptics.success()
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
        <Text style={[type.caption, styles.label]}>5% de descuento en Eneba con el código</Text>
        <Text style={[type.price(compact ? 18 : 20, 'bold'), styles.code]} selectable>{ENEBA_DISCOUNT_CODE.toUpperCase()}</Text>
      </View>
      <Touchable
        onPress={() => void copy()}
        style={[styles.button, copied && styles.buttonDone]}
        accessibilityRole="button"
        accessibilityLabel={`Copiar el código ${ENEBA_DISCOUNT_CODE.toUpperCase()}`}
      >
        <Icon name={copied ? 'checkmark' : 'copy'} size={13} color="#fff" weight="semibold" />
        <Text style={[type.footnoteEmphasized, styles.buttonText]}>{copied ? 'Copiado' : 'Copiar'}</Text>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primaryLight, borderWidth: 1.5, borderStyle: 'dashed', borderColor: `${colors.primary}99`,
    borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14,
  },
  compact: { paddingVertical: 10, paddingHorizontal: 12 },
  label: { color: colors.secondaryLabel },
  code: { color: colors.navy, letterSpacing: 1.5 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  buttonDone: { backgroundColor: colors.primaryDark },
  buttonText: { color: '#fff' },
})
