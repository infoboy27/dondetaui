import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppState } from '../state/AppStateContext'
import { useCountry } from '../hooks/useCountry'
import { useSignupNudge } from '../hooks/useSignupNudge'
import { nudgeCopy } from '../domain/signupNudge'
import Icon from './Icon'
import Button from './ui/Button'
import Touchable from './ui/Touchable'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'

// Home card for signed-out users: the app's version of the web's first-visit
// prompt. An inline card (no modal), dismissible for 14 days, never shown
// once the person has an account (src/domain/signupNudge.ts).
export default function SignupNudgeCard() {
  const router = useRouter()
  const { user, authLoading } = useAppState()
  const country = useCountry()
  const { visible, dismiss } = useSignupNudge(Boolean(user))
  if (authLoading || !visible) return null

  const copy = nudgeCopy(country.code)
  const open = () => {
    if (copy.target === 'black-friday') router.push({ pathname: '/black-friday-alerts', params: { activar: '1' } })
    else router.push({ pathname: '/auth', params: { mode: 'register' } })
  }

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.icon}>
          <Icon name={copy.target === 'black-friday' ? 'envelope' : 'bellFill'} size={18} color={colors.primary} />
        </View>
        <Text style={[type.headline, styles.title]}>{copy.title}</Text>
        <Touchable onPress={dismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="Ahora no">
          <Icon name="close" size={14} color={colors.tertiaryLabel} weight="semibold" />
        </Touchable>
      </View>
      <Text style={[type.subheadline, styles.text]}>{copy.text}</Text>
      <Button title="Crear cuenta gratis" variant="tinted" onPress={open} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.lg, marginBottom: spacing.xxl, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.navy, flex: 1 },
  text: { color: colors.secondaryLabel, marginBottom: spacing.xs },
})
