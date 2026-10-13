import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { useAppState } from '../../../src/state/AppStateContext'
import { authApi } from '../../../src/api/auth'
import { accountError } from '../../../src/api/errors'
import Icon, { type IconName } from '../../../src/components/Icon'
import Button from '../../../src/components/ui/Button'
import Touchable from '../../../src/components/ui/Touchable'
import { CodeField, FieldGroup, PasswordField } from '../../../src/components/ui/Fields'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'
import { haptics } from '../../../src/design/haptics'
import type { MfaMethod } from '../../../src/types'

type Step =
  | { kind: 'overview' }
  | { kind: 'password'; action: 'email' | 'totp' | 'disable' }
  | { kind: 'totp'; secret: string | null; otpauthUrl: string | null }

const METHODS: { method: MfaMethod; icon: IconName; title: string; text: string }[] = [
  { method: 'email', icon: 'envelope', title: 'Código por correo', text: 'Te enviamos un código cada vez que inicies sesión. Lo más sencillo.' },
  { method: 'totp', icon: 'authApp', title: 'App autenticadora', text: 'Google Authenticator, Authy o Contraseñas de iPhone. Funciona sin conexión.' },
]

export default function TwoFactorScreen() {
  const router = useRouter()
  const { user, auth } = useAppState()
  const [step, setStep] = useState<Step>({ kind: 'overview' })
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!user) return null

  const reset = () => {
    setStep({ kind: 'overview' })
    setPassword('')
    setCode('')
    setError(null)
  }

  const choose = (method: MfaMethod) => {
    if (method === 'email' && !user.emailVerified) {
      Alert.alert('Confirma tu correo primero', 'Para recibir los códigos por correo necesitamos saber que el correo es tuyo.', [
        { text: 'Ahora no', style: 'cancel' },
        { text: 'Confirmar correo', onPress: () => router.push('/auth/verify-email') },
      ])
      return
    }
    setStep({ kind: 'password', action: method })
  }

  const confirmPassword = async () => {
    if (step.kind !== 'password' || !password) return
    setBusy(true)
    setError(null)
    try {
      if (step.action === 'email') {
        auth.setUser(await authApi.enableEmailMfa(password))
        haptics.success()
        reset()
      } else if (step.action === 'disable') {
        auth.setUser(await authApi.disableMfa(password))
        haptics.success()
        reset()
      } else {
        const setup = await authApi.setupTotp(password)
        setPassword('')
        setStep({ kind: 'totp', secret: setup.secret, otpauthUrl: setup.otpauthUrl })
      }
    } catch (e) {
      haptics.warning()
      setError(accountError(e, 'No pudimos guardar el cambio.'))
    } finally {
      setBusy(false)
    }
  }

  const confirmTotp = async (value = code) => {
    if (value.length !== 6 || busy) return
    setBusy(true)
    setError(null)
    try {
      auth.setUser(await authApi.enableTotp(value))
      haptics.success()
      reset()
    } catch (e) {
      haptics.warning()
      setCode('')
      setError(accountError(e, 'No pudimos verificar el código.'))
    } finally {
      setBusy(false)
    }
  }

  const active = user.mfaMethod ? METHODS.find(m => m.method === user.mfaMethod) : null

  return (
    <>
      <Stack.Screen options={{ title: 'Verificación en dos pasos', headerLargeTitle: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step.kind === 'overview' && (
            <>
              <View style={styles.status}>
                <Icon name="shield" size={36} color={active ? colors.primary : colors.tertiaryLabel} />
                <Text style={[type.title3, styles.statusTitle]}>{active ? 'Activada' : 'Desactivada'}</Text>
                <Text style={[type.subheadline, styles.muted]}>
                  {active
                    ? `Al iniciar sesión, además de tu contraseña, te pediremos ${active.method === 'email' ? 'un código que te enviamos por correo' : 'el código de tu app autenticadora'}.`
                    : 'Agrega un segundo paso al iniciar sesión: aunque alguien sepa tu contraseña, no podrá entrar sin el código.'}
                </Text>
              </View>

              {active ? (
                <Button title="Desactivar" variant="tinted" onPress={() => setStep({ kind: 'password', action: 'disable' })} />
              ) : (
                <View style={styles.options}>
                  {METHODS.map(option => (
                    <Touchable key={option.method} onPress={() => choose(option.method)} feedback="scale" style={styles.option} accessibilityRole="button">
                      <View style={styles.optionIcon}>
                        <Icon name={option.icon} size={20} color={colors.primaryDark} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[type.headline, styles.optionTitle]}>{option.title}</Text>
                        <Text style={[type.footnote, styles.optionText]}>{option.text}</Text>
                      </View>
                      <Icon name="chevronRight" size={13} color={colors.tertiaryLabel} weight="semibold" />
                    </Touchable>
                  ))}
                </View>
              )}
            </>
          )}

          {step.kind === 'password' && (
            <>
              <Text style={[type.subheadline, styles.lead]}>
                {step.action === 'disable' ? 'Escribe tu contraseña para desactivar la verificación en dos pasos.' : 'Escribe tu contraseña para continuar.'}
              </Text>
              <FieldGroup>
                <PasswordField value={password} onChangeText={setPassword} placeholder="Contraseña" autoFocus returnKeyType="go" onSubmitEditing={() => void confirmPassword()} />
              </FieldGroup>
              {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
              <Button title={step.action === 'disable' ? 'Desactivar' : 'Continuar'} onPress={() => void confirmPassword()} disabled={!password} loading={busy} />
              <Button title="Cancelar" variant="plain" onPress={reset} style={styles.secondary} />
            </>
          )}

          {step.kind === 'totp' && (
            <>
              {step.secret ? (
                <>
                  <Text style={[type.headline, styles.stepTitle]}>1. Agrega DóndeTa a tu app autenticadora</Text>
                  {!!step.otpauthUrl && (
                    <Button title="Agregar a mi app autenticadora" icon="authApp" variant="tinted" onPress={() => void Linking.openURL(step.otpauthUrl!).catch(() => {})} />
                  )}
                  <Text style={[type.footnote, styles.muted, styles.keyLabel]}>O escribe esta clave en la app:</Text>
                  <Touchable
                    onPress={() => {
                      void Clipboard.setStringAsync(step.secret!)
                      haptics.success()
                    }}
                    style={styles.key}
                    accessibilityRole="button"
                    accessibilityLabel="Copiar clave"
                  >
                    <Text style={[type.price(16, 'semibold'), styles.keyText]} selectable>{step.secret.match(/.{1,4}/g)?.join(' ')}</Text>
                    <Icon name="copy" size={16} color={colors.primaryDark} />
                  </Touchable>
                  <Text style={[type.headline, styles.stepTitle]}>2. Escribe el código que muestra</Text>
                </>
              ) : (
                <Text style={[type.subheadline, styles.lead]}>Tu cuenta ya tiene una app autenticadora configurada. Escribe el código de DóndeTa que muestra para activarla al iniciar sesión.</Text>
              )}
              <CodeField value={code} onChange={setCode} onComplete={value => void confirmTotp(value)} autoFocus={false} />
              {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
              <Button title="Activar" onPress={() => void confirmTotp()} disabled={code.length !== 6} loading={busy} />
              <Button title="Cancelar" variant="plain" onPress={reset} style={styles.secondary} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.page },
  status: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xl, paddingHorizontal: spacing.lg },
  statusTitle: { color: colors.navy },
  muted: { color: colors.secondaryLabel, textAlign: 'center' },
  options: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, borderCurve: 'continuous', padding: spacing.lg },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { color: colors.navy },
  optionText: { color: colors.secondaryLabel, marginTop: 2 },
  lead: { color: colors.secondaryLabel, marginVertical: spacing.lg, textAlign: 'center' },
  stepTitle: { color: colors.navy, marginTop: spacing.lg, marginBottom: spacing.md },
  keyLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  key: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radii.md, borderCurve: 'continuous', padding: spacing.lg,
  },
  keyText: { color: colors.navy, letterSpacing: 1 },
  error: { color: '#D9363E', textAlign: 'center', marginBottom: spacing.md },
  secondary: { marginTop: spacing.sm },
})
