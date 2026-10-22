import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Touchable from './ui/Touchable'
import { useCountry } from '../hooks/useCountry'
import { useCountryPreference } from '../state/CountryContext'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'

// Shown after the country was picked from the device region, so a wrong guess
// (traveling, phone set to another region) is one tap to fix.
export default function CountryBanner() {
  const router = useRouter()
  const country = useCountry()
  const { pref, dismissBanner } = useCountryPreference()
  if (!pref.auto || pref.bannerDismissed) return null

  return (
    <View style={styles.banner}>
      <Text style={[type.footnote, styles.text]}>
        {country.flag} Mostrando tiendas {country.storesAdjective}.
      </Text>
      <Touchable onPress={() => router.push('/country')} accessibilityRole="button" accessibilityLabel="Cambiar de país">
        <Text style={[type.footnote, styles.action]}>Cambiar</Text>
      </Touchable>
      <Touchable onPress={dismissBanner} accessibilityRole="button" accessibilityLabel="Cerrar aviso">
        <Text style={[type.footnote, styles.close]}>✕</Text>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.md, paddingVertical: 10, paddingHorizontal: spacing.md,
    borderRadius: radii.md, backgroundColor: colors.primaryLight,
  },
  text: { flex: 1, color: colors.navy },
  action: { color: colors.primaryDark, fontWeight: '700' },
  close: { color: colors.navy400 },
})
