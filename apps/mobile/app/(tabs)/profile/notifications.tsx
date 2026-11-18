import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from 'react-native'
import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useAppState } from '../../../src/state/AppStateContext'
import { notificationPrefsApi } from '../../../src/api/notificationPrefs'
import { savedSearchesApi } from '../../../src/api/savedSearches'
import { friendlyError } from '../../../src/api/errors'
import {
  ALERT_TYPES,
  PROMOTIONAL_TYPES,
  withPref,
  type NotificationPrefs,
  type NotificationType,
  type NotificationTypeInfo,
} from '../../../src/domain/notificationPrefs'
import { describeMaxPrice, type SavedSearch } from '../../../src/domain/savedSearches'
import type { IconName } from '../../../src/components/Icon'
import { ListRow, ListSection, ListSwitchRow } from '../../../src/components/ui/GroupedList'
import { colors, spacing } from '../../../src/design/tokens'
import { type } from '../../../src/design/type'

const ICONS: Record<NotificationType, { icon: IconName; color: string }> = {
  back_in_stock: { icon: 'shippingbox', color: colors.primary },
  lowest_price_90d: { icon: 'trendDown', color: colors.primaryDark },
  card_discount: { icon: 'tag', color: '#2F7DF6' },
  saved_search: { icon: 'search', color: colors.navy600 },
  weekly_digest: { icon: 'envelope', color: colors.accent },
  deal_real: { icon: 'sparkles', color: colors.accent },
}

// Perfil › Notificaciones: the push switch for this phone, one switch per kind
// of notice (stored on the account, so it applies to email and push), and the
// saved searches. Promotions are opt-in (Apple 4.5.4) and can be turned off here.
export default function NotificationsScreen() {
  const router = useRouter()
  const { user, push } = useAppState()
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [searches, setSearches] = useState<SavedSearch[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      let alive = true
      setError(null)
      Promise.all([notificationPrefsApi.get(), savedSearchesApi.list()])
        .then(([loadedPrefs, loadedSearches]) => {
          if (!alive) return
          setPrefs(loadedPrefs)
          setSearches(loadedSearches)
        })
        .catch(e => { if (alive) setError(friendlyError(e, 'No pudimos cargar tus avisos. Intenta de nuevo.')) })
      return () => { alive = false }
    }, [user?.id]),
  )

  const toggle = async (kind: NotificationType, value: boolean) => {
    if (!prefs) return
    const before = prefs
    setPrefs(withPref(prefs, kind, value))
    setError(null)
    try {
      setPrefs(await notificationPrefsApi.update({ [kind]: value }))
    } catch (e) {
      setPrefs(before)
      setError(friendlyError(e, 'No pudimos guardar el cambio. Intenta de nuevo.'))
    }
  }

  const confirmDelete = (search: SavedSearch) => {
    Alert.alert(`¿Borrar “${search.query}”?`, 'Dejarás de recibir avisos de esta búsqueda.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          savedSearchesApi.remove(search.id)
            .then(() => setSearches(list => (list ?? []).filter(item => item.id !== search.id)))
            .catch(e => setError(friendlyError(e, 'No pudimos borrar la búsqueda. Intenta de nuevo.')))
        },
      },
    ])
  }

  const switches = (list: readonly NotificationTypeInfo[]) =>
    list.map(info => (
      <ListSwitchRow
        key={info.type}
        icon={ICONS[info.type].icon}
        iconColor={ICONS[info.type].color}
        title={info.title}
        subtitle={info.description}
        value={prefs?.[info.type] ?? false}
        disabled={!prefs}
        onValueChange={value => void toggle(info.type, value)}
      />
    ))

  return (
    <>
      <Stack.Screen options={{ title: 'Notificaciones' }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.screen} contentContainerStyle={styles.content}>
        {push.supported && (
          <ListSection footer="Avisos en este teléfono. Si lo apagas, lo que actives abajo te sigue llegando por correo.">
            <ListSwitchRow
              icon="bellFill"
              iconColor="#E5383B"
              title="Notificaciones push"
              value={push.enabled}
              onValueChange={on => void push.setEnabled(on)}
            />
          </ListSection>
        )}

        {!prefs && !error ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <>
            <ListSection header="Tus alertas" footer="Sobre lo que guardas o sigues. Te llegan por correo y, con las notificaciones push activas, en este teléfono.">
              {switches(ALERT_TYPES)}
            </ListSection>

            <ListSection header="Promociones (opcional)" footer="Solo te llegan si las activas. Puedes apagarlas aquí cuando quieras.">
              {switches(PROMOTIONAL_TYPES)}
            </ListSection>

            <ListSection
              header="Búsquedas guardadas"
              footer={searches?.length
                ? 'Toca una búsqueda para borrarla.'
                : 'En Buscar, toca “Guardar búsqueda” y te avisamos cuando aparezca algo nuevo o baje de tu precio máximo.'}
            >
              {searches?.length
                ? searches.map(search => (
                  <ListRow
                    key={search.id}
                    icon="search"
                    iconColor={colors.navy600}
                    title={search.query}
                    value={describeMaxPrice(search.maxPrice)}
                    onPress={() => confirmDelete(search)}
                    accessibilityLabel={`${search.query}, ${describeMaxPrice(search.maxPrice)}. Toca para borrar.`}
                  />
                ))
                : <ListRow icon="search" iconColor={colors.navy600} title="Buscar productos" onPress={() => router.navigate('/search')} />}
            </ListSection>
          </>
        )}
        {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.page, paddingTop: spacing.sm },
  loading: { marginVertical: spacing.xl },
  error: { color: colors.error, textAlign: 'center', marginTop: spacing.md },
})
