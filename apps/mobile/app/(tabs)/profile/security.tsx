import { useState } from 'react'
import { Alert, ScrollView, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useAppState } from '../../../src/state/AppStateContext'
import { accountError } from '../../../src/api/errors'
import { ListRow, ListSection } from '../../../src/components/ui/GroupedList'
import { colors, spacing } from '../../../src/design/tokens'
import { haptics } from '../../../src/design/haptics'

const MFA_LABEL = { email: 'Correo', totp: 'App' } as const

export default function SecurityScreen() {
  const router = useRouter()
  const { user, auth } = useAppState()
  const [busy, setBusy] = useState(false)

  // Signed out while here (account deleted, session closed elsewhere).
  if (!user) return null

  const logoutEverywhere = () => {
    Alert.alert(
      '¿Cerrar sesión en todos los dispositivos?',
      'Se cerrará en la web y en tus otros teléfonos. Aquí seguirás con la sesión abierta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesiones',
          style: 'destructive',
          onPress: async () => {
            setBusy(true)
            try {
              await auth.logoutEverywhere()
              haptics.success()
              Alert.alert('Listo', 'Cerramos la sesión en tus otros dispositivos.')
            } catch (e) {
              Alert.alert('No se pudo', accountError(e, 'Intenta de nuevo en un momento.'))
            } finally {
              setBusy(false)
            }
          },
        },
      ],
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Seguridad' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
        <ListSection header="Correo" footer={user.emailVerified ? undefined : 'Confírmalo para poder recuperar tu cuenta y activar la verificación por correo.'}>
          <ListRow icon="envelope" iconColor={colors.primary} title={user.email} />
          <ListRow
            icon={user.emailVerified ? 'checkmarkCircle' : 'exclamation'}
            iconColor={user.emailVerified ? colors.primary : colors.accent}
            title={user.emailVerified ? 'Correo confirmado' : 'Confirmar correo'}
            onPress={user.emailVerified ? undefined : () => router.push('/auth/verify-email')}
          />
        </ListSection>

        <ListSection header="Inicio de sesión">
          <ListRow icon="key" iconColor="#8E8E93" title="Cambiar contraseña" onPress={() => router.push('/profile/change-password')} />
          <ListRow
            icon="shield"
            iconColor="#2F7DF6"
            title="Verificación en 2 pasos"
            value={user.mfaMethod ? MFA_LABEL[user.mfaMethod] : 'No'}
            onPress={() => router.push('/profile/two-factor')}
          />
        </ListSection>

        <ListSection footer="Cierra la sesión en la web y en tus otros dispositivos. Útil si entraste desde uno que ya no usas o que no es tuyo.">
          <ListRow icon="devices" iconColor={colors.navy600} title={busy ? 'Cerrando sesiones…' : 'Cerrar todas las sesiones'} onPress={busy ? undefined : logoutEverywhere} />
        </ListSection>

        <ListSection>
          <ListRow title="Eliminar cuenta" destructive onPress={() => router.push('/profile/delete-account')} />
        </ListSection>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page, paddingTop: spacing.sm },
})
