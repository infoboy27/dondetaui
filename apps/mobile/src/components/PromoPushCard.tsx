import { StyleSheet, Text, View } from 'react-native'
import { useAppState } from '../state/AppStateContext'
import { PROMO_COPY } from '../domain/promoPush'
import Icon from './Icon'
import Button from './ui/Button'
import Touchable from './ui/Touchable'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'

// Home card offering "Ofertas y recordatorios" (Guideline 4.5.4 opt-in). Inline,
// never a modal; "×" hides it for a month; gone once the person chooses.
export default function PromoPushCard() {
  const { promo } = useAppState()
  if (!promo.cardVisible) return null

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name="bellFill" size={18} color={colors.accent} />
        </View>
        <Text style={[type.headline, styles.title]}>{PROMO_COPY.title}</Text>
        <Touchable onPress={promo.dismissCard} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
          <Icon name="close" size={14} color={colors.tertiaryLabel} weight="semibold" />
        </Touchable>
      </View>
      <Text style={[type.subheadline, styles.text]}>{PROMO_COPY.text}</Text>
      <Button title="Activar avisos" variant="tinted" onPress={() => void promo.setEnabled(true)} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.lg, marginBottom: spacing.xxl, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.navy, flex: 1 },
  text: { color: colors.secondaryLabel, marginBottom: spacing.xs },
})
