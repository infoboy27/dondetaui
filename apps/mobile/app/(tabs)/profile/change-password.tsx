import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useAppState } from '../../../src/state/AppStateContext'
import { accountError } from '../../../src/api/errors'
import Button from '../../../src/components/ui/Button'
import { FieldGroup, FieldSeparator, PasswordField } from '../../../src/components/ui/Fields'
import { colors, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'
import { haptics } from '../../../src/design/haptics'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const { auth } = useAppState()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSubmit = current.length > 0 && next.length >= 8 && !busy

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      await auth.changePassword(current, next)
      haptics.success()
      Alert.alert('Contraseña cambiada', 'Cerramos la sesión en tus otros dispositivos.')
      router.back()
    } catch (e) {
      haptics.warning()
      setError(accountError(e, 'No pudimos cambiar la contraseña.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Cambiar contraseña', headerLargeTitle: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FieldGroup footer="Mínimo 8 caracteres. Al cambiarla se cierra la sesión en tus otros dispositivos.">
            <PasswordField value={current} onChangeText={setCurrent} placeholder="Contraseña actual" autoFocus />
            <FieldSeparator />
            <PasswordField value={next} onChangeText={setNext} placeholder="Nueva contraseña" isNew returnKeyType="go" onSubmitEditing={() => void submit()} />
          </FieldGroup>
          {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
          <Button title="Cambiar contraseña" onPress={() => void submit()} disabled={!canSubmit} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.page },
  error: { color: '#D9363E', textAlign: 'center', marginBottom: spacing.md },
})
