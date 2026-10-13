import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useAppState } from '../../src/state/AppStateContext'
import { authApi } from '../../src/api/auth'
import { accountError } from '../../src/api/errors'
import { useCloseAuth } from '../../src/hooks/useCloseAuth'
import { useCountdown } from '../../src/hooks/useCountdown'
import Icon from '../../src/components/Icon'
import Button from '../../src/components/ui/Button'
import { CodeField } from '../../src/components/ui/Fields'
import { colors, spacing } from '../../src/design/tokens'
import { type } from '../../src/design/type'
import { haptics } from '../../src/design/haptics'

// Confirms the account's email with a 6-digit code. Right after sign-up
// (`onboarding`) the code is already in the welcome email.
export default function VerifyEmailScreen() {
  const close = useCloseAuth()
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>()
  const { user, auth } = useAppState()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const resend = useCountdown(60, Boolean(onboarding))

  const send = async () => {
    setError(null)
    try {
      const { alreadyVerified } = await authApi.sendVerification()
      if (alreadyVerified) setDone(true)
      else resend.start()
    } catch (e) {
      setError(accountError(e, 'No pudimos enviar el código.'))
    }
  }

  useEffect(() => {
    if (!onboarding) void send()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return
    setBusy(true)
    setError(null)
    try {
      auth.setUser(await authApi.verifyEmail(value))
      haptics.success()
      setDone(true)
    } catch (e) {
      haptics.warning()
      setCode('')
      setError(accountError(e, 'No pudimos confirmar el correo.'))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <>
        <Stack.Screen options={{ title: 'Correo confirmado', headerShown: false }} />
        <View style={[styles.screen, styles.doneWrap]}>
          <Icon name="checkmarkCircle" size={56} color={colors.primary} />
          <Text style={[type.title2, styles.title]}>¡Listo!</Text>
          <Text style={[type.subheadline, styles.text]}>Tu correo quedó confirmado. Ya puedes recibir alertas de precio y activar la verificación en dos pasos.</Text>
          <Button title="Continuar" onPress={close} style={styles.doneButton} />
        </View>
      </>
    )
  }

  return (
    <>
      {/* Right after sign-up the screen has its own big welcome title. */}
      <Stack.Screen options={{ title: 'Confirma tu correo', headerShown: !onboarding }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Icon name="envelope" size={40} color={colors.primary} weight="regular" />
          {!!onboarding && <Text style={[type.title3, styles.title]}>¡Bienvenido a DóndeTa!</Text>}
          <Text style={[type.subheadline, styles.text]}>
            Escribe el código de 6 dígitos que enviamos a {user?.email ?? 'tu correo'}.
          </Text>
        </View>

        <CodeField value={code} onChange={setCode} onComplete={value => void verify(value)} />
        {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
        <Button title="Confirmar correo" onPress={() => void verify()} disabled={code.length !== 6} loading={busy} />
        <Button
          title={resend.left > 0 ? `Reenviar código en ${resend.left} s` : 'Reenviar código'}
          variant="plain"
          disabled={resend.left > 0}
          onPress={() => void send()}
          style={styles.secondary}
        />
        {!!onboarding && <Button title="Ahora no" variant="plain" onPress={close} />}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.page },
  intro: { alignItems: 'center', gap: spacing.md, marginTop: spacing.page, marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  title: { color: colors.navy, textAlign: 'center' },
  text: { color: colors.secondaryLabel, textAlign: 'center' },
  error: { color: '#D9363E', textAlign: 'center', marginBottom: spacing.md },
  secondary: { marginTop: spacing.sm },
  doneWrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: spacing.md },
  doneButton: { alignSelf: 'stretch', marginTop: spacing.lg },
})
