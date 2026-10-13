import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useAppState } from '../../src/state/AppStateContext'
import { accountError } from '../../src/api/errors'
import { useCloseAuth } from '../../src/hooks/useCloseAuth'
import { useCountdown } from '../../src/hooks/useCountdown'
import Icon from '../../src/components/Icon'
import Button from '../../src/components/ui/Button'
import { CodeField } from '../../src/components/ui/Fields'
import { colors, spacing } from '../../src/design/tokens'
import { type } from '../../src/design/type'
import { haptics } from '../../src/design/haptics'
import type { MfaMethod } from '../../src/types'

// Second step of sign-in for accounts with two-step verification.
export default function MfaScreen() {
  const router = useRouter()
  const close = useCloseAuth()
  const { auth } = useAppState()
  const pending = auth.pendingMfa
  const [method, setMethod] = useState<MfaMethod>(pending?.method ?? 'email')
  const [emailHint, setEmailHint] = useState(pending?.emailHint ?? null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The first email code was sent with the sign-in itself.
  const resend = useCountdown(60, pending?.method === 'email')

  useEffect(() => {
    if (!pending) router.back()
  }, [pending, router])

  const verify = async (value = code) => {
    if (value.length !== 6 || busy) return
    setBusy(true)
    setError(null)
    try {
      await auth.verifyMfa(value, method)
      haptics.success()
      close()
    } catch (e) {
      haptics.warning()
      setCode('')
      setError(accountError(e, 'No pudimos verificar el código.'))
    } finally {
      setBusy(false)
    }
  }

  const sendEmail = async () => {
    setError(null)
    try {
      setEmailHint(await auth.sendMfaEmail())
      setMethod('email')
      setCode('')
      resend.start()
    } catch (e) {
      setError(accountError(e, 'No pudimos enviar el código.'))
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Verificación en dos pasos' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Icon name={method === 'totp' ? 'authApp' : 'envelope'} size={40} color={colors.primary} weight="regular" />
          <Text style={[type.subheadline, styles.text]}>
            {method === 'totp'
              ? 'Abre tu app autenticadora y escribe el código de 6 dígitos de DóndeTa.'
              : `Escribe el código de 6 dígitos que enviamos a ${emailHint ?? 'tu correo'}.`}
          </Text>
        </View>

        <CodeField value={code} onChange={setCode} onComplete={value => void verify(value)} />

        {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}

        <Button title="Continuar" onPress={() => void verify()} disabled={code.length !== 6} loading={busy} />

        {method === 'email' ? (
          <Button
            title={resend.left > 0 ? `Reenviar código en ${resend.left} s` : 'Reenviar código'}
            variant="plain"
            disabled={resend.left > 0}
            onPress={() => void sendEmail()}
            style={styles.secondary}
          />
        ) : (
          <Button title="¿No tienes tu teléfono? Recibir código por correo" variant="plain" onPress={() => void sendEmail()} style={styles.secondary} />
        )}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.page },
  intro: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl, paddingHorizontal: spacing.lg },
  text: { color: colors.secondaryLabel, textAlign: 'center' },
  error: { color: '#D9363E', textAlign: 'center', marginBottom: spacing.md },
  secondary: { marginTop: spacing.sm },
})
