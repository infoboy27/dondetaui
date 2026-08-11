import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppState } from '../../src/state/AppStateContext'
import { colors, radii, spacing } from '../../src/design/tokens'
import { fonts } from '../../src/design/fonts'

export default function ProfileScreen() {
  const { user, authLoading, authError, login, register, logout, favoriteIds } = useAppState()

  if (authLoading && !user) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name ?? user.email).charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name ?? user.email}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{favoriteIds.size}</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </View>
          </View>

          <Pressable onPress={() => void logout()} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return <AuthForm login={login} register={register} error={authError} loading={authLoading} />
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Mi cuenta</Text>
        <Text style={styles.subtitle}>Guarda tus favoritos y alertas en tu cuenta de DóndeTa.</Text>

        <View style={styles.tabs}>
          <Pressable onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.tabActive]}>
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Iniciar sesión</Text>
          </Pressable>
          <Pressable onPress={() => setMode('register')} style={[styles.tab, mode === 'register' && styles.tabActive]}>
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Crear cuenta</Text>
          </Pressable>
        </View>

        {mode === 'register' && (
          <View style={styles.field}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Carlos Almonte" placeholderTextColor={colors.navy400} style={styles.input} />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>CORREO</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={colors.navy400}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.navy400}
            style={styles.input}
            secureTextEntry
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable onPress={() => void submit()} disabled={!canSubmit} style={[styles.submit, !canSubmit && styles.submitDisabled]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', padding: spacing.xxxl },
  avatar: { width: 72, height: 72, borderRadius: radii.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  avatarText: { color: '#fff', fontSize: 28, fontFamily: fonts.display.black },
  name: { fontSize: 18, fontFamily: fonts.display.extrabold, color: colors.navy, marginTop: spacing.md },
  email: { fontFamily: fonts.body.regular, color: colors.navy400, fontSize: 13, marginTop: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xxl },
  stat: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  statValue: { fontSize: 22, fontFamily: fonts.display.black, color: colors.navy },
  statLabel: { fontFamily: fonts.body.regular, color: colors.navy400, fontSize: 12, marginTop: spacing.xs },
  logoutButton: { marginTop: spacing.xxxl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  logoutText: { color: '#BE123C', fontFamily: fonts.body.bold },
  formContent: { padding: spacing.xl, paddingTop: spacing.xxxl },
  title: { fontSize: 22, fontFamily: fonts.display.black, color: colors.navy, textAlign: 'center' },
  subtitle: { fontFamily: fonts.body.regular, color: colors.navy400, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.md },
  tabActive: { backgroundColor: colors.primaryLight },
  tabText: { fontFamily: fonts.body.medium, color: colors.navy400, fontSize: 13 },
  tabTextActive: { color: colors.primary, fontFamily: fonts.body.bold },
  field: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.body.bold, color: colors.navy400, fontSize: 11, letterSpacing: 0.5, marginBottom: spacing.xs },
  input: { height: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: spacing.md, color: colors.navy, fontFamily: fonts.body.regular },
  errorText: { color: '#BE123C', fontFamily: fonts.body.bold, marginBottom: spacing.md, textAlign: 'center' },
  submit: { height: 50, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  submitDisabled: { backgroundColor: colors.navy200 },
  submitText: { color: '#fff', fontFamily: fonts.body.bold, fontSize: 15 },
})
