import { ScrollView, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { ListRow, ListSection } from '../src/components/ui/GroupedList'
import { COUNTRY_LIST } from '../src/domain/countries'
import { useCountry } from '../src/hooks/useCountry'
import { useCountryPreference } from '../src/state/CountryContext'
import { colors, spacing } from '../src/design/tokens'

// Each country has its own catalog and stores. Changing it reloads the app on
// that country's data (and its own account, since accounts are per country).
export default function CountryScreen() {
  const router = useRouter()
  const country = useCountry()
  const { choose } = useCountryPreference()

  const pick = async (code: (typeof COUNTRY_LIST)[number]['code']) => {
    if (code === country.code) return router.back()
    await choose(code)
  }

  return (
    <>
      <Stack.Screen options={{ title: 'País', headerLargeTitle: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
        <ListSection
          header="Dónde compras"
          footer="Cada país tiene sus propias tiendas, precios y moneda. Si compras para enviar a otro país, elige el país de las tiendas."
        >
          {COUNTRY_LIST.map(item => (
            <ListRow
              key={item.code}
              title={`${item.flag}  ${item.name}`}
              value={item.code === country.code ? '✓' : undefined}
              onPress={() => void pick(item.code)}
            />
          ))}
        </ListSection>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
})
