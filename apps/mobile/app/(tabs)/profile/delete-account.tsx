import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useAppState } from '../../../src/state/AppStateContext'
import { accountError } from '../../../src/api/errors'
import Icon from '../../../src/components/Icon'
import Button from '../../../src/components/ui/Button'
import { FieldGroup, PasswordField } from '../../../src/components/ui/Fields'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'
import { haptics } from '../../../src/design/haptics'

const DELETED = ['Tus favoritos y alertas de precio', 'Tus reseñas', 'Tu historial de búsquedas', 'Tu cuenta y sus datos de acceso']

// Account deletion, required by the App Store and Google Play.
export default function DeleteAccountScreen() {
  const router = useRouter()
  const { auth } = useAppState()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = () => {
    Alert.alert('¿Eliminar tu cuenta?', 'Esto no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void remove() },
    ])
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await auth.deleteAccount(password)
      haptics.success()
      // Back to Perfil, which now shows the signed-out card.
      router.dismissTo('/profile')
      Alert.alert('Cuenta eliminada', 'Borramos tu cuenta y sus datos. Puedes seguir usando DóndeTa sin cuenta.')
    } catch (e) {
      haptics.warning()
      setError(accountError(e, 'No pudimos eliminar la cuenta.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Eliminar cuenta', headerLargeTitle: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Icon name="trash" size={30} color="#D9363E" />
            <Text style={[type.title3, styles.title]}>Se borrará para siempre</Text>
            {DELETED.map(item => (
              <View key={item} style={styles.item}>
                <Icon name="close" size={13} color="#D9363E" weight="semibold" />
                <Text style={[type.subheadline, styles.itemText]}>{item}</Text>
              </View>
            ))}
            <Text style={[type.footnote, styles.note]}>Puedes seguir usando DóndeTa sin cuenta, o crear una nueva cuando quieras.</Text>
          </View>

          <FieldGroup footer="Escribe tu contraseña para confirmar.">
            <PasswordField value={password} onChangeText={setPassword} placeholder="Contraseña" />
          </FieldGroup>
          {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
          <Button title="Eliminar mi cuenta" onPress={confirm} disabled={!password || busy} loading={busy} style={styles.danger} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.page },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.xl, gap: spacing.sm, marginBottom: spacing.xl },
  title: { color: colors.navy, marginTop: spacing.xs, marginBottom: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemText: { color: colors.navy },
  note: { color: colors.secondaryLabel, marginTop: spacing.sm },
  error: { color: '#D9363E', textAlign: 'center', marginBottom: spacing.md },
  danger: { backgroundColor: '#D9363E' },
})
