import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type ModeratedReview } from '../../api/admin'
import { colors, fonts, radii } from '../../design/tokens'

const REASON: Record<string, string> = { offensive: 'ofensiva', spam: 'spam', false: 'falsa', other: 'otro' }

const button = (tone: 'plain' | 'danger' | 'primary') => ({
  border: tone === 'plain' ? `1px solid ${colors.border}` : 'none',
  background: tone === 'danger' ? '#D64545' : tone === 'primary' ? colors.primary : colors.card,
  color: tone === 'plain' ? colors.navy : '#fff',
  borderRadius: radii.sm, padding: '6px 10px', fontFamily: fonts.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
})

// Reported and hidden reviews. App Store Guideline 1.2: act on reports
// within 24 h -- each new report also pings DISCORD_WEBHOOK_ALERTS.
export default function AdminReviews() {
  const [rows, setRows] = useState<ModeratedReview[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const refresh = () => adminApi.reviewQueue().then(setRows).catch(err => setError(err instanceof Error ? err.message : String(err)))
  useEffect(() => { void refresh() }, [])

  const act = async (id: string, action: () => Promise<unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(id)
    setError(null)
    try {
      await action()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, fontFamily: fonts.body, color: colors.navy }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 64px' }}>
        <Link to="/admin" style={{ color: colors.primary, fontSize: 14 }}>← Volver</Link>
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, margin: '12px 0 4px' }}>Reseñas reportadas</h1>
        <p style={{ color: colors.navy400, fontSize: 14, marginTop: 0 }}>
          Con 3 reportes una reseña se oculta sola hasta que decidas. Ocultar la quita de la web y la app; Eliminar la borra.
          Bloquear impide que esa cuenta publique reseñas.
        </p>
        {error && <p style={{ color: '#D64545', fontSize: 14 }}>{error}</p>}
        {rows === null ? (
          <p style={{ color: colors.navy400 }}>Cargando…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: colors.navy400 }}>No hay reseñas reportadas. 🎉</p>
        ) : (
          rows.map(review => (
            <div key={review.id} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.lg, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 13, color: colors.navy400 }}>
                <span>
                  {review.productSlug ? <a href={`/product/${review.productSlug}`} style={{ color: colors.primary }}>{review.productName}</a> : review.productName}
                  {' · '}{'★'.repeat(review.rating)}
                </span>
                <span>
                  {review.reports} {review.reports === 1 ? 'reporte' : 'reportes'}
                  {review.reasons.length > 0 && ` (${review.reasons.map(r => REASON[r] ?? r).join(', ')})`}
                  {review.hiddenAt && <strong style={{ color: '#D64545' }}> · oculta{review.hiddenReason === 'reports' ? ' por reportes' : ''}</strong>}
                </span>
              </div>
              <p style={{ fontSize: 15, margin: '10px 0', whiteSpace: 'pre-wrap' }}>{review.comment ?? <em style={{ color: colors.navy400 }}>(sin comentario)</em>}</p>
              <div style={{ fontSize: 12.5, color: colors.navy400, marginBottom: 10 }}>
                {review.authorName} · {review.authorEmail}{review.authorBanned && <strong style={{ color: '#D64545' }}> · bloqueado para reseñas</strong>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', opacity: busy === review.id ? 0.5 : 1 }}>
                {review.hiddenAt ? (
                  <button type="button" style={button('plain')} disabled={busy !== null} onClick={() => void act(review.id, () => adminApi.unhideReview(review.id))}>
                    Mostrar de nuevo
                  </button>
                ) : (
                  <button type="button" style={button('primary')} disabled={busy !== null} onClick={() => void act(review.id, () => adminApi.hideReview(review.id))}>
                    Ocultar
                  </button>
                )}
                <button type="button" style={button('danger')} disabled={busy !== null}
                  onClick={() => void act(review.id, () => adminApi.deleteReview(review.id), '¿Eliminar esta reseña para siempre?')}>
                  Eliminar
                </button>
                <button type="button" style={button('plain')} disabled={busy !== null}
                  onClick={() => void act(review.id, () => adminApi.banReviewAuthor(review.id, !review.authorBanned),
                    review.authorBanned ? undefined : `¿Bloquear a ${review.authorEmail} para que no publique más reseñas?`)}>
                  {review.authorBanned ? 'Desbloquear autor' : 'Bloquear autor'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
