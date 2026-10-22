import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { useAppState } from '../../../src/state/AppStateContext'
import { useCountry } from '../../../src/hooks/useCountry'
import Icon, { type IconName } from '../../../src/components/Icon'
import Button from '../../../src/components/ui/Button'
import Touchable from '../../../src/components/ui/Touchable'
import { ListRow, ListSection } from '../../../src/components/ui/GroupedList'
import { colors, radii, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'

const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: 'bellFill', text: 'Alertas cuando baje el precio de lo que te interesa' },
  { icon: 'sync', text: 'Tus favoritos en el teléfono y en la web' },
  { icon: 'starFill', text: 'Reseñas para ayudar a otros a decidir' },
]

const MFA_LABEL = { email: 'Correo', totp: 'App autenticadora' } as const

export default function ProfileScreen() {
  const router = useRouter()
  const { user, authLoading, auth, favoriteIds, alertedIds } = useAppState()

  return (
    <>
      <Stack.Screen options={{ title: 'Perfil' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
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

            {user.emailVerified === false && (
              <Touchable onPress={() => router.push('/auth/verify-email')} style={styles.notice} accessibilityRole="button">
                <Icon name="envelope" size={20} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.subheadlineEmphasized, styles.noticeTitle]}>Confirma tu correo</Text>
                  <Text style={[type.footnote, styles.noticeText]}>Lo necesitas para recuperar tu cuenta y recibir alertas por correo.</Text>
                </View>
                <Icon name="chevronRight" size={13} color={colors.tertiaryLabel} weight="semibold" />
              </Touchable>
            )}

            <ListSection>
              <ListRow icon="heartFill" iconColor={colors.accent} title="Favoritos" value={String(favoriteIds.size)} onPress={() => router.navigate('/alerts')} />
              <ListRow icon="bellFill" iconColor={colors.primary} title="Alertas de precio" value={String(alertedIds.size)} onPress={() => router.navigate('/alerts')} />
            </ListSection>

            <ListSection>
              <ListRow
                icon="shield"
                iconColor="#2F7DF6"
                title="Seguridad"
                value={user.mfaMethod ? `2FA: ${MFA_LABEL[user.mfaMethod]}` : undefined}
                onPress={() => router.push('/profile/security')}
              />
            </ListSection>

            <SupportLinks />

            <ListSection>
              <ListRow title="Cerrar sesión" destructive onPress={() => void auth.logout()} />
            </ListSection>
          </>
        ) : (
          <>
            <View style={styles.guestCard}>
              <View style={styles.guestIcon}>
                <Icon name="personAdd" size={28} color={colors.primary} />
              </View>
              <Text style={[type.title2, styles.guestTitle]}>Tu cuenta DóndeTa</Text>
              <Text style={[type.subheadline, styles.guestText]}>Es gratis. Sin cuenta igual puedes buscar, comparar y escanear.</Text>
              <View style={styles.benefits}>
                {BENEFITS.map(benefit => (
                  <View key={benefit.text} style={styles.benefit}>
                    <Icon name={benefit.icon} size={16} color={colors.primary} />
                    <Text style={[type.subheadline, styles.benefitText]}>{benefit.text}</Text>
                  </View>
                ))}
              </View>
              <Button title="Crear cuenta gratis" onPress={() => router.push({ pathname: '/auth', params: { mode: 'register' } })} style={styles.guestButton} />
              <Button title="Ya tengo cuenta" variant="plain" onPress={() => router.push('/auth')} />
            </View>
            <SupportLinks />
          </>
        )}
        <Text style={[type.caption, styles.version]}>DóndeTa {Constants.expoConfig?.version ?? ''}</Text>
      </ScrollView>
    </>
  )
}

// Same links as the web footer (src/components/SiteLinks.tsx).
function SupportLinks() {
  const router = useRouter()
  const country = useCountry()
  return (
    <ListSection header="DóndeTa">
      <ListRow icon="location" title="País" value={`${country.flag} ${country.name}`} onPress={() => router.push('/country')} />
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
  notice: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.accentLight,
    borderRadius: radii.md, borderCurve: 'continuous', padding: spacing.lg, marginBottom: spacing.xxl,
  },
  noticeTitle: { color: colors.navy },
  noticeText: { color: colors.secondaryLabel },
  guestCard: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xxl },
  guestIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  guestTitle: { color: colors.navy, marginTop: spacing.md },
  guestText: { color: colors.secondaryLabel, textAlign: 'center', marginTop: spacing.xs },
  benefits: { alignSelf: 'stretch', gap: spacing.md, marginVertical: spacing.xl },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitText: { color: colors.navy, flex: 1 },
  guestButton: { alignSelf: 'stretch' },
  version: { color: colors.tertiaryLabel, textAlign: 'center' },
})
