import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

// Placeholder for Phase A (navigation foundation only) -- login/register and
// the real account menu come in Phase C of the mobile plan.
export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.text}>Próximamente: inicia sesión para guardar tus favoritos y alertas.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  title: { fontSize: 20, fontFamily: fonts.display.extrabold, color: colors.navy, marginBottom: spacing.sm },
  text: { fontFamily: fonts.body.regular, color: colors.navy400, textAlign: 'center' },
})
