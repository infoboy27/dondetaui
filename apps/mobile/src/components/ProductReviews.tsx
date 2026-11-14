import { useEffect, useMemo, useState } from 'react'
import { ActionSheetIOS, Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { reviewsApi, type Review, type ReviewSummary } from '../api/reviews'
import { REPORT_OPTIONS, withoutBlocked, type ReportReason } from '../domain/reviewBlocks'
import { useBlockedAuthors } from '../hooks/useBlockedAuthors'
import { colors, radii, spacing } from '../design/tokens'
import { type } from '../design/type'
import { haptics } from '../design/haptics'
import Icon from './Icon'
import Button from './ui/Button'
import Touchable from './ui/Touchable'
import { useAppState } from '../state/AppStateContext'

const STARS = [1, 2, 3, 4, 5]

export default function ProductReviews({ productId }: { productId: string }) {
  const router = useRouter()
  const { user } = useAppState()
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { blocked, hideAuthor } = useBlockedAuthors(Boolean(user))
  const visibleReviews = useMemo(() => withoutBlocked(summary?.reviews ?? [], blocked), [summary, blocked])

  const report = async (review: Review, reason: ReportReason) => {
    try {
      const result = await reviewsApi.report(review.id, reason)
      haptics.success()
      if (result.hidden) setSummary(current => current && { ...current, reviews: current.reviews.filter(r => r.id !== review.id) })
      Alert.alert('Gracias por avisarnos', 'Revisamos los reportes en menos de 24 horas.')
    } catch {
      Alert.alert('No se pudo enviar', 'Intenta de nuevo en un momento.')
    }
  }

  // "Reportar" needs an account (one report per person); hiding an author
  // works for anyone, on this phone.
  const chooseReason = (review: Review) => {
    if (!user) {
      router.push({ pathname: '/auth', params: { reason: 'reviews' } })
      return
    }
    const labels = REPORT_OPTIONS.map(option => option.label)
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: '¿Por qué reportas esta reseña?', options: [...labels, 'Cancelar'], cancelButtonIndex: labels.length },
        index => { const option = REPORT_OPTIONS[index]; if (option) void report(review, option.reason) },
      )
    } else {
      Alert.alert('¿Por qué reportas esta reseña?', undefined, [
        ...REPORT_OPTIONS.slice(0, 2).map(option => ({ text: option.label, onPress: () => void report(review, option.reason) })),
        { text: 'Otro motivo', onPress: () => void report(review, 'other') },
      ], { cancelable: true })
    }
  }

  const openMenu = (review: Review) => {
    const actions: { label: string; destructive?: boolean; run: () => void }[] = [
      { label: 'Reportar reseña', destructive: true, run: () => chooseReason(review) },
    ]
    if (review.authorKey) {
      const key = review.authorKey
      actions.push({ label: 'Ocultar reseñas de este usuario', run: () => { hideAuthor(key); haptics.success() } })
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...actions.map(a => a.label), 'Cancelar'], cancelButtonIndex: actions.length, destructiveButtonIndex: 0 },
        index => actions[index]?.run(),
      )
    } else {
      Alert.alert('Reseña', undefined, [
        ...actions.map(a => ({ text: a.label, style: a.destructive ? ('destructive' as const) : ('default' as const), onPress: a.run })),
        { text: 'Cancelar', style: 'cancel' as const },
      ], { cancelable: true })
    }
  }

  useEffect(() => {
    let cancelled = false
    reviewsApi.list(productId)
      .then(result => { if (!cancelled) setSummary(result) })
      .catch(() => { if (!cancelled) setSummary({ average: 0, count: 0, reviews: [] }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [productId])

  const openForm = () => {
    if (!user) {
      router.push({ pathname: '/auth', params: { reason: 'reviews' } })
      return
    }
    setShowForm(true)
  }

  const submit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    setError(null)
    try {
      const review = await reviewsApi.submit(productId, rating, comment.trim() || undefined)
      setSummary(current => {
        const reviews = [review, ...(current?.reviews ?? [])]
        const count = reviews.length
        const average = reviews.reduce((sum, r) => sum + r.rating, 0) / count
        return { average, count, reviews }
      })
      setShowForm(false)
      setRating(0)
      setComment('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la reseña')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[type.title3, styles.sectionTitle]}>Reseñas</Text>
        <Touchable onPress={() => (showForm ? setShowForm(false) : openForm())} hitSlop={8} accessibilityRole="button">
          <Text style={[type.subheadline, styles.link]}>{showForm ? 'Cancelar' : 'Escribir reseña'}</Text>
        </Touchable>
      </View>

      {summary && summary.count > 0 && (
        <View style={styles.averageRow}>
          <Text style={[type.price(28, 'bold'), styles.average]}>{summary.average.toFixed(1)}</Text>
          <View>
            <Stars value={Math.round(summary.average)} size={14} />
            <Text style={[type.caption, styles.muted]}>{summary.count === 1 ? '1 reseña' : `${summary.count} reseñas`}</Text>
          </View>
        </View>
      )}

      {showForm && (
        <View style={styles.card}>
          <View style={styles.starRow}>
            {STARS.map(value => (
              <Touchable
                key={value}
                onPress={() => { haptics.selection(); setRating(value) }}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`${value} de 5 estrellas`}
                accessibilityState={{ selected: value === rating }}
              >
                <Icon name={value <= rating ? 'starFill' : 'star'} size={30} color={value <= rating ? colors.yellow : colors.navy200} />
              </Touchable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="¿Qué te pareció este producto? (opcional)"
            placeholderTextColor={colors.tertiaryLabel}
            style={[type.body, styles.input]}
            multiline
            numberOfLines={3}
          />
          {error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
          <Button title="Enviar reseña" onPress={() => void submit()} disabled={rating === 0} loading={submitting} />
        </View>
      )}

      {visibleReviews.length > 0 && (
        <View style={styles.card}>
          {visibleReviews.slice(0, 5).map((review, index) => (
            <View key={review.id} style={[styles.reviewRow, index > 0 && styles.reviewDivider]}>
              <View style={styles.reviewHeader}>
                <Text style={[type.subheadlineEmphasized, styles.reviewName]}>{review.userName}</Text>
                <View style={styles.reviewMeta}>
                  <Stars value={review.rating} size={12} />
                  <Touchable onPress={() => openMenu(review)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Opciones de la reseña: reportar u ocultar">
                    <Icon name="ellipsis" size={16} color={colors.tertiaryLabel} weight="semibold" />
                  </Touchable>
                </View>
              </View>
              {!!review.comment && <Text style={[type.subheadline, styles.reviewComment]}>{review.comment}</Text>}
            </View>
          ))}
        </View>
      )}

      {summary && summary.count === 0 && !showForm && (
        <Text style={[type.subheadline, styles.muted]}>Todavía no hay reseñas. ¿Lo compraste? Cuéntale a los demás qué tal.</Text>
      )}
    </View>
  )
}

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <View style={styles.stars} accessibilityLabel={`${value} de 5 estrellas`}>
      {STARS.map(star => (
        <Icon key={star} name={star <= value ? 'starFill' : 'star'} size={size} color={star <= value ? colors.yellow : colors.navy200} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xxl, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.navy },
  link: { color: colors.primaryDark },
  averageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  average: { color: colors.navy },
  muted: { color: colors.secondaryLabel },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderCurve: 'continuous', padding: spacing.lg, gap: spacing.md },
  starRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  stars: { flexDirection: 'row', gap: 2 },
  input: { minHeight: 80, borderRadius: radii.md, borderCurve: 'continuous', backgroundColor: colors.fill, padding: spacing.md, color: colors.navy, textAlignVertical: 'top' },
  error: { color: '#E5383B' },
  reviewRow: { gap: 4 },
  reviewDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator, paddingTop: spacing.md },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewName: { color: colors.navy },
  reviewComment: { color: colors.secondaryLabel },
})
