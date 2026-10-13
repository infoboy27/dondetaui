import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useAppState } from '../../src/state/AppStateContext'
import { authApi } from '../../src/api/auth'
import { accountError } from '../../src/api/errors'
import { useCloseAuth } from '../../src/hooks/useCloseAuth'
import { useCountdown } from '../../src/hooks/useCountdown'
import Icon from '../../src/components/Icon'
import Button from '../../src/components/ui/Button'
import { CodeField, FieldGroup, PasswordField, TextField } from '../../src/components/ui/Fields'
import { colors, spacing } from '../../src/design/tokens'
import { type } from '../../src/design/type'
import { haptics } from '../../src/design/haptics'

// Password recovery: email -> 6-digit code + new password -> signed in.
export default function ForgotPasswordScreen() {
  const router = useRouter()
  const close = useCloseAuth()
  const { auth } = useAppState()
  const params = useLocalSearchParams<{ email?: string }>()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState(params.email ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resend = useCountdown()

  const sendCode = async () => {
    if (!/\S+@\S+\.\S+/.test(email.trim())) return
    setBusy(true)
    setError(null)
    try {
      await authApi.forgotPassword(email.trim())
      setStep('reset')
      resend.start()
    } catch (e) {
      setError(accountError(e, 'No pudimos enviar el código.'))
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (code.length !== 6 || password.length < 8) return
    setBusy(true)
    setError(null)
    try {
      const outcome = await auth.resetPassword(email, code, password)
      haptics.success()
      if (outcome === 'mfa') router.replace('/auth/mfa')
      else close()
    } catch (e) {
      haptics.warning()
      setError(accountError(e, 'No pudimos cambiar la contraseña.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Recuperar contraseña' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Icon name="key" size={36} color={colors.primary} weight="regular" />
            <Text style={[type.subheadline, styles.text]}>
              {step === 'email'
                ? 'Escribe el correo de tu cuenta y te enviaremos un código para elegir una contraseña nueva.'
                : `Si existe una cuenta con ${email.trim()}, te enviamos un código. Escríbelo y elige tu nueva contraseña.`}
            </Text>
          </View>

          {step === 'email' ? (
            <>
              <FieldGroup>
                <TextField
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoFocus={!email}
                  returnKeyType="send"
                  onSubmitEditing={() => void sendCode()}
                />
              </FieldGroup>
              {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
              <Button title="Enviar código" onPress={() => void sendCode()} disabled={!/\S+@\S+\.\S+/.test(email.trim())} loading={busy} />
            </>
          ) : (
            <>
              <CodeField value={code} onChange={setCode} />
              <FieldGroup footer="Mínimo 8 caracteres. Se cerrará la sesión en tus otros dispositivos.">
                <PasswordField value={password} onChangeText={setPassword} placeholder="Nueva contraseña" isNew returnKeyType="go" onSubmitEditing={() => void reset()} />
              </FieldGroup>
              {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
              <Button title="Cambiar contraseña" onPress={() => void reset()} disabled={code.length !== 6 || password.length < 8} loading={busy} />
              <Button
                title={resend.left > 0 ? `Reenviar código en ${resend.left} s` : 'Reenviar código'}
                variant="plain"
                disabled={resend.left > 0 || busy}
                onPress={() => void sendCode()}
                style={styles.secondary}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.page },
  intro: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl, paddingHorizontal: spacing.lg },
  text: { color: colors.secondaryLabel, textAlign: 'center' },
  error: { color: '#D9363E', textAlign: 'center', marginBottom: spacing.md },
  secondary: { marginTop: spacing.sm },
})
