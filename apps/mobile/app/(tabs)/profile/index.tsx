import { useRef, useState } from 'react'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Stack } from 'expo-router'
import Constants from 'expo-constants'
import { useAppState } from '../../../src/state/AppStateContext'
import Button from '../../../src/components/ui/Button'
import SegmentedControl from '../../../src/components/ui/SegmentedControl'
import { ListRow, ListSection } from '../../../src/components/ui/GroupedList'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'

export default function ProfileScreen() {
  const { user, authLoading, authError, login, register, logout, favoriteIds, alertedIds } = useAppState()

  return (
    <>
      <Stack.Screen options={{ title: 'Perfil' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" style={styles.screen} contentContainerStyle={styles.content}>
        {authLoading && !user ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.page }} />
        ) : user ? (
          <>
            <View style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={[type.title1, styles.avatarText]}>{(user.name ?? user.email).charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[type.title2, styles.name]}>{user.name ?? user.email}</Text>
              {!!user.name && <Text style={[type.subheadline, styles.email]}>{user.email}</Text>}
            </View>
            <ListSection>
              <ListRow icon="heartFill" iconColor={colors.accent} title="Favoritos" value={String(favoriteIds.size)} />
              <ListRow icon="bellFill" iconColor={colors.primary} title="Alertas de precio" value={String(alertedIds.size)} />
            </ListSection>
            <SupportLinks />
            <ListSection>
              <ListRow title="Cerrar sesión" destructive onPress={() => void logout()} />
            </ListSection>
          </>
        ) : (
          <>
            <AuthForm login={login} register={register} error={authError} loading={authLoading} />
            <SupportLinks />
          </>
        )}
        <Text style={[type.caption, styles.version]}>DóndeTa {Constants.expoConfig?.version ?? ''}</Text>
      </ScrollView>
    </>
  )
}

function AuthForm({
  login,
  register,
  error,
  loading,
}: {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  error: string | null
  loading: boolean
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)

  const submit = async () => {
    try {
      if (mode === 'login') await login(email.trim(), password)
      else await register(email.trim(), password, name.trim() || undefined)
    } catch {
      /* error already surfaced via authError */
    }
  }

  const canSubmit = email.trim().length > 3 && password.length >= 8 && !loading

  return (
    <View style={styles.form}>
      <Text style={[type.title3, styles.formTitle]}>Tu cuenta DóndeTa</Text>
      <Text style={[type.subheadline, styles.formText]}>Guarda favoritos en todos tus dispositivos y recibe alertas cuando un precio baje.</Text>

      <SegmentedControl
        segments={[{ value: 'login', label: 'Iniciar sesión' }, { value: 'register', label: 'Crear cuenta' }]}
        value={mode}
        onChange={setMode}
      />

      <View style={styles.fields}>
        {mode === 'register' && (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre"
              placeholderTextColor={colors.tertiaryLabel}
              style={[type.body, styles.input]}
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <View style={styles.fieldSeparator} />
          </>
        )}
        <TextInput
          ref={emailRef}
          value={email}
          onChangeText={setEmail}
          placeholder="Correo"
          placeholderTextColor={colors.tertiaryLabel}
          style={[type.body, styles.input]}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <View style={styles.fieldSeparator} />
        <TextInput
          ref={passwordRef}
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'register' ? 'Contraseña (mínimo 8 caracteres)' : 'Contraseña'}
          placeholderTextColor={colors.tertiaryLabel}
          style={[type.body, styles.input]}
          secureTextEntry
          textContentType={mode === 'register' ? 'newPassword' : 'password'}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          returnKeyType="go"
          onSubmitEditing={() => { if (canSubmit) void submit() }}
        />
      </View>

      {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}

      <Button title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} onPress={() => void submit()} disabled={!canSubmit} loading={loading} />
    </View>
  )
}

// Same links as the web footer (src/components/SiteLinks.tsx).
function SupportLinks() {
  return (
    <ListSection header="DóndeTa">
      <ListRow icon="donate" iconColor="#E5383B" title="Apóyanos con una donación" external onPress={() => void Linking.openURL('https://www.paypal.com/donate/?hosted_button_id=V7TJW93WQCTE8')} />
      <ListRow icon="chat" iconColor="#5865F2" title="Comunidad en Discord" external onPress={() => void Linking.openURL('https://discord.gg/sxcSngrTZv')} />
      <ListRow icon="lock" iconColor={colors.navy600} title="Política de privacidad" external onPress={() => void Linking.openURL('https://dondeta.com.do/privacy')} />
    </ListSection>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page, paddingTop: spacing.sm },
  identity: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff' },
  name: { color: colors.navy, marginTop: spacing.md, textAlign: 'center' },
  email: { color: colors.secondaryLabel, marginTop: 2 },
  form: { marginBottom: spacing.xxl },
  formTitle: { color: colors.navy },
  formText: { color: colors.secondaryLabel, marginTop: spacing.xs, marginBottom: spacing.lg },
  fields: { backgroundColor: colors.card, borderRadius: radii.md, borderCurve: 'continuous', marginBottom: spacing.lg },
  input: { minHeight: 48, paddingHorizontal: spacing.lg, color: colors.navy },
  fieldSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: spacing.lg },
  error: { color: '#E5383B', marginBottom: spacing.md, textAlign: 'center' },
  version: { color: colors.tertiaryLabel, textAlign: 'center' },
})
