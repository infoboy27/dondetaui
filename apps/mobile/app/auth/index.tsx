import { useRef, useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useAppState } from '../../src/state/AppStateContext'
import { accountError } from '../../src/api/errors'
import { useCloseAuth } from '../../src/hooks/useCloseAuth'
import Icon, { type IconName } from '../../src/components/Icon'
import Button from '../../src/components/ui/Button'
import SegmentedControl from '../../src/components/ui/SegmentedControl'
import Touchable from '../../src/components/ui/Touchable'
import { FieldGroup, FieldSeparator, PasswordField, TextField } from '../../src/components/ui/Fields'
import { colors, spacing } from '../../src/design/tokens'
import { type } from '../../src/design/type'
import { haptics } from '../../src/design/haptics'

// Why the sheet opened (?reason=), so it can say what the account is for.
type AccountReason = 'alerts' | 'reviews' | 'sync'

const REASONS: Record<AccountReason | 'default', { icon: IconName; title: string; text: string }> = {
  alerts: { icon: 'bellFill', title: 'Te avisamos cuando baje', text: 'Con una cuenta gratis te enviamos una notificación cuando el precio de este producto baje.' },
  reviews: { icon: 'starFill', title: 'Comparte tu experiencia', text: 'Crea una cuenta gratis para escribir reseñas y ayudar a otros a decidir.' },
  sync: { icon: 'sync', title: 'Tus guardados en todas partes', text: 'Con una cuenta, tus favoritos y alertas se sincronizan entre el teléfono y la web.' },
  default: { icon: 'personFill', title: 'Tu cuenta DóndeTa', text: 'Guarda productos en todos tus dispositivos y recibe alertas cuando un precio baje.' },
}

export default function AuthScreen() {
  const router = useRouter()
  const close = useCloseAuth()
  const { reason, mode: initialMode } = useLocalSearchParams<{ reason?: AccountReason; mode?: 'login' | 'register' }>()
  const { auth } = useAppState()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode === 'register' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const intro = REASONS[reason ?? 'default'] ?? REASONS.default

  const canSubmit = /\S+@\S+\.\S+/.test(email.trim()) && password.length >= (mode === 'register' ? 8 : 1) && !busy

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        const outcome = await auth.login(email, password)
        haptics.success()
        if (outcome === 'mfa') router.push('/auth/mfa')
        else close()
      } else {
        await auth.register(email, password, name)
        haptics.success()
        router.replace({ pathname: '/auth/verify-email', params: { onboarding: '1' } })
      }
    } catch (e) {
      haptics.warning()
      setError(accountError(e, mode === 'login' ? 'No pudimos iniciar sesión.' : 'No pudimos crear tu cuenta.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta',
          headerRight: () => (
            <Touchable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Text style={[type.body, styles.headerAction]}>Cerrar</Text>
            </Touchable>
          ),
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Icon name={intro.icon} size={26} color={colors.primary} />
            </View>
            <Text style={[type.title2, styles.introTitle]}>{intro.title}</Text>
            <Text style={[type.subheadline, styles.introText]}>{intro.text}</Text>
          </View>

          <SegmentedControl
            segments={[{ value: 'login', label: 'Iniciar sesión' }, { value: 'register', label: 'Crear cuenta' }]}
            value={mode}
            onChange={next => {
              setMode(next)
              setError(null)
            }}
          />

          <FieldGroup footer={mode === 'register' ? 'Mínimo 8 caracteres. Te enviaremos un código para confirmar tu correo.' : undefined}>
            {mode === 'register' && (
              <>
                <TextField
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre (opcional)"
                  textContentType="givenName"
                  autoComplete="given-name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                <FieldSeparator />
              </>
            )}
            <TextField
              ref={emailRef}
              value={email}
              onChangeText={setEmail}
              placeholder="Correo"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType={mode === 'register' ? 'username' : 'emailAddress'}
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <FieldSeparator />
            <PasswordField
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              isNew={mode === 'register'}
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
            />
          </FieldGroup>

          {!!error && (
            <View style={styles.error} accessibilityLiveRegion="polite">
              <Icon name="exclamation" size={14} color="#D9363E" />
              <Text style={[type.footnote, styles.errorText]}>{error}</Text>
            </View>
          )}

          <Button title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} onPress={() => void submit()} disabled={!canSubmit} loading={busy} />

          {mode === 'login' ? (
            <Button
              title="¿Olvidaste tu contraseña?"
              variant="plain"
              onPress={() => router.push({ pathname: '/auth/forgot', params: { email: email.trim() } })}
              style={styles.secondary}
            />
          ) : (
            <Text style={[type.footnote, styles.legal]}>
              Al crear tu cuenta aceptas nuestra{' '}
              <Text style={styles.link} onPress={() => void Linking.openURL('https://dondeta.com.do/privacy')}>Política de privacidad</Text>.
            </Text>
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
  headerAction: { color: colors.primaryDark },
  intro: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  introIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  introTitle: { color: colors.navy, marginTop: spacing.md, textAlign: 'center' },
  introText: { color: colors.secondaryLabel, marginTop: spacing.xs, textAlign: 'center' },
  error: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  errorText: { color: '#D9363E', flex: 1 },
  secondary: { marginTop: spacing.sm },
  legal: { color: colors.secondaryLabel, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  link: { color: colors.primaryDark },
})
