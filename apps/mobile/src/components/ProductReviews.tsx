import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { reviewsApi, type ReviewSummary } from '../api/reviews'
import { colors, radii, spacing } from '../design/tokens'
import { fonts } from '../design/fonts'
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
      router.push('/(tabs)/profile')
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

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
  }

  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Reseñas {summary && summary.count > 0 ? `(${summary.count})` : ''}</Text>
        <Pressable onPress={() => (showForm ? setShowForm(false) : openForm())}>
          <Text style={styles.link}>{showForm ? 'Cancelar' : 'Escribir reseña'}</Text>
        </Pressable>
      </View>

      {summary && summary.count > 0 && (
        <Text style={styles.average}>★ {summary.average.toFixed(1)} de 5</Text>
      )}

      {showForm && (
        <View style={styles.form}>
          <View style={styles.starRow}>
            {STARS.map(value => (
              <Pressable key={value} onPress={() => setRating(value)} hitSlop={6}>
                <Text style={[styles.star, value <= rating && styles.starFilled]}>★</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="¿Qué te pareció este producto? (opcional)"
            placeholderTextColor={colors.navy400}
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            onPress={() => void submit()}
            disabled={rating === 0 || submitting}
            style={[styles.submit, (rating === 0 || submitting) && styles.submitDisabled]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Enviar reseña</Text>}
          </Pressable>
        </View>
      )}

      {summary?.reviews.slice(0, 5).map(review => (
        <View key={review.id} style={styles.reviewRow}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewName}>{review.userName}</Text>
            <Text style={styles.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
          </View>
          {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
        </View>
      ))}

      {summary && summary.count === 0 && !showForm && (
        <Text style={styles.empty}>Todavía no hay reseñas para este producto.</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontFamily: fonts.display.extrabold, color: colors.navy },
  link: { color: colors.primary, fontFamily: fonts.body.bold, fontSize: 13 },
  average: { color: colors.accent, fontFamily: fonts.display.bold, marginTop: spacing.xs },
  empty: { color: colors.navy400, fontFamily: fonts.body.regular, marginTop: spacing.sm, fontSize: 13 },
  form: { backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.md },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  star: { fontSize: 26, color: colors.navy200 },
  starFilled: { color: colors.yellow },
  input: { minHeight: 64, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, padding: spacing.md, color: colors.navy, fontFamily: fonts.body.regular, textAlignVertical: 'top' },
  error: { color: '#BE123C', fontFamily: fonts.body.bold, marginTop: spacing.sm, fontSize: 12 },
  submit: { height: 44, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  submitDisabled: { backgroundColor: colors.navy200 },
  submitText: { color: '#fff', fontFamily: fonts.body.bold },
  reviewRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: spacing.md },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewName: { color: colors.navy, fontFamily: fonts.body.bold, fontSize: 13 },
  reviewStars: { color: colors.yellow, fontSize: 13 },
  reviewComment: { color: colors.navy400, fontFamily: fonts.body.regular, fontSize: 13, marginTop: spacing.xs },
})
