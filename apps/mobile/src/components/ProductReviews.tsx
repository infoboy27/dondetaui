import { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { reviewsApi, type ReviewSummary } from '../api/reviews'
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
      router.navigate('/profile')
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

      {!!summary?.reviews.length && (
        <View style={styles.card}>
          {summary.reviews.slice(0, 5).map((review, index) => (
            <View key={review.id} style={[styles.reviewRow, index > 0 && styles.reviewDivider]}>
              <View style={styles.reviewHeader}>
                <Text style={[type.subheadlineEmphasized, styles.reviewName]}>{review.userName}</Text>
                <Stars value={review.rating} size={12} />
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
  reviewName: { color: colors.navy },
  reviewComment: { color: colors.secondaryLabel },
})
