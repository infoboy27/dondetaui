import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useAppState } from '../src/state/AppStateContext'
import { useCountry } from '../src/hooks/useCountry'
import { digestsApi } from '../src/api/digests'
import { friendlyError } from '../src/api/errors'
import Icon from '../src/components/Icon'
import Button from '../src/components/ui/Button'
import { colors, radii, spacing } from '../src/design/tokens'
import { type } from '../src/design/type'
import { haptics } from '../src/design/haptics'

// The app's /cuenta/black-friday: the real Black Friday offers by email
// (Wednesday, Black Friday and Cyber Monday). ?activar=1 (from the ad or the
// Home card) subscribes as soon as there is a session -- after signing in or
// creating the account in the auth sheet, this screen is still underneath.
export default function BlackFridayAlertsScreen() {
  const router = useRouter()
  const { activar } = useLocalSearchParams<{ activar?: string }>()
  const { user, authLoading } = useAppState()
  const country = useCountry()
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoTried = useRef(false)
  const available = country.code === 'DO'

  useEffect(() => {
    if (!user || !available) { setSubscribed(null); return }
    let alive = true
    const run = async () => {
      try {
        let status = await digestsApi.status('black-friday')
        if (!status && activar === '1' && !autoTried.current) {
          autoTried.current = true
          status = await digestsApi.subscribe('black-friday')
          haptics.success()
        }
        if (alive) setSubscribed(status)
      } catch (e) {
        if (alive) setError(friendlyError(e, 'No pudimos ver tu suscripción. Intenta de nuevo.'))
      }
    }
    void run()
    return () => { alive = false }
  }, [user?.id, available, activar])

  const toggle = async () => {
    setBusy(true)
    setError(null)
    try {
      const next = subscribed ? await digestsApi.unsubscribe('black-friday') : await digestsApi.subscribe('black-friday')
      if (next) haptics.success()
      setSubscribed(next)
    } catch (e) {
      setError(friendlyError(e, 'No pudimos guardar el cambio. Intenta de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Black Friday' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name={subscribed ? 'checkmarkCircle' : 'envelope'} size={28} color={colors.primary} />
          </View>
          <Text style={[type.title2, styles.title]}>
            {subscribed ? 'Listo, te avisamos' : 'Te avisamos solo de las ofertas reales'}
          </Text>
          <Text style={[type.subheadline, styles.text]}>
            {subscribed
              ? 'El miércoles antes de Black Friday, el viernes y el Cyber Monday te llega por correo lo que de verdad bajó: cada precio comparado con sus últimos 30 días.'
              : 'Comparamos cada precio con sus últimos 30 días. Si subió antes de “bajar”, no te llega. Un correo el miércoles, el viernes y el Cyber Monday.'}
          </Text>

          {!available ? (
            <Text style={[type.footnote, styles.note]}>Por ahora este correo es solo para República Dominicana.</Text>
          ) : authLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.spacer} />
          ) : !user ? (
            <>
              <Button
                title="Crear cuenta gratis"
                onPress={() => router.push({ pathname: '/auth', params: { mode: 'register', landing: '/cuenta/black-friday' } })}
                style={styles.button}
              />
              <Button title="Ya tengo cuenta" variant="plain" onPress={() => router.push('/auth')} />
            </>
          ) : subscribed === null && !error ? (
            <ActivityIndicator color={colors.primary} style={styles.spacer} />
          ) : (
            <Button
              title={subscribed ? 'Dejar de recibirlos' : 'Avisarme por correo'}
              variant={subscribed ? 'plain' : undefined}
              loading={busy}
              onPress={() => void toggle()}
              style={styles.button}
            />
          )}
          {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.xl, alignItems: 'center' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.navy, marginTop: spacing.md, textAlign: 'center' },
  text: { color: colors.secondaryLabel, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  note: { color: colors.secondaryLabel, textAlign: 'center' },
  button: { alignSelf: 'stretch' },
  spacer: { marginVertical: spacing.lg },
  error: { color: colors.error, textAlign: 'center', marginTop: spacing.md },
})
