import { useState } from 'react'
import { adminApi } from '../../api/admin'
import { colors, fonts, radii } from '../../design/tokens'

// Publish your own images (a campaign, a partnership announcement) instead of
// a product card: one image or a carousel for the feed, or one story.
const MAX_SIDE = 1080
const MAX_TOTAL_BYTES = 5.5 * 1024 * 1024 // the API takes 6 MB of JSON per request

interface Slide { name: string; dataUrl: string; bytes: number; ratio: number }

async function toJpeg(file: File): Promise<Slide> {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`No se pudo leer ${file.name}`))
      img.src = url
    })
    const scale = Math.min(1, MAX_SIDE / image.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff' // PNG transparency -> white, JPEG has no alpha
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    return { name: file.name, dataUrl, bytes: Math.round((dataUrl.length - 23) * 0.75), ratio: canvas.width / canvas.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function CustomPost({ onPublished }: { onPublished: () => void }) {
  const [target, setTarget] = useState<'feed' | 'story'>('feed')
  const [slides, setSlides] = useState<Slide[]>([])
  const [caption, setCaption] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const total = slides.reduce((sum, slide) => sum + slide.bytes, 0)
  // Instagram feed: 4:5 to 1.91:1. Story: 9:16.
  const badRatio = slides.some(slide => (target === 'story' ? Math.abs(slide.ratio - 9 / 16) > 0.02 : slide.ratio < 0.79 || slide.ratio > 1.92))
  const problem = !slides.length ? 'Elige al menos una imagen.'
    : target === 'story' && slides.length > 1 ? 'Una historia lleva una sola imagen.'
    : slides.length > 10 ? 'Un carrusel lleva como máximo 10 imágenes.'
    : target === 'feed' && !caption.trim() ? 'Escribe el texto del post.'
    : total > MAX_TOTAL_BYTES ? 'Las imágenes pesan demasiado juntas; quita alguna.'
    : null

  const pick = async (files: FileList | null) => {
    if (!files?.length) return
    setMessage(null)
    try {
      const added = await Promise.all([...files].map(toJpeg))
      setSlides(current => [...current, ...added])
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : String(error) })
    }
  }

  const move = (index: number, delta: number) => setSlides(current => {
    const next = [...current]
    const [slide] = next.splice(index, 1)
    next.splice(Math.max(0, Math.min(next.length, index + delta)), 0, slide)
    return next
  })

  const publish = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await adminApi.igPublishCustom({ target, caption: caption.trim(), imagesBase64: slides.map(slide => slide.dataUrl) })
      setMessage({ ok: true, text: 'Publicando en Instagram… Un carrusel tarda 1-4 minutos; el estado aparece en "Publicaciones recientes".' })
      setSlides([])
      setCaption('')
      onPublished()
      // Re-check once it has had time to finish.
      setTimeout(onPublished, 90_000)
      setTimeout(onPublished, 240_000)
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : String(error) })
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <section style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.lg, padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontFamily: fonts.display, fontSize: 17 }}>Publicación propia</h2>
        <span style={{ fontSize: 13, color: colors.navy400 }}>Campañas y anuncios con tus propias imágenes.</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['feed', 'story'] as const).map(value => (
            <button key={value} type="button" onClick={() => setTarget(value)} aria-pressed={target === value} style={{
              ...pill, background: target === value ? colors.navy : colors.background, color: target === value ? '#fff' : colors.navy,
            }}>
              {value === 'feed' ? 'Post / carrusel' : 'Historia'}
            </button>
          ))}
        </div>
      </div>

      <label style={{ ...pill, alignSelf: 'start', justifySelf: 'start', background: colors.primaryLight, color: colors.primaryDark, cursor: 'pointer' }}>
        + Añadir imágenes
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e => { void pick(e.target.files); e.target.value = '' }} style={{ display: 'none' }} />
      </label>

      {slides.length > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {slides.map((slide, index) => (
            <div key={`${slide.name}-${index}`} style={{ flexShrink: 0, width: 130, display: 'grid', gap: 4, fontSize: 11 }}>
              <img src={slide.dataUrl} alt={slide.name} style={{ width: '100%', borderRadius: radii.sm, border: `1px solid ${colors.border}` }} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ flex: 1, color: colors.navy400 }}>{index + 1}. {Math.round(slide.bytes / 1024)} KB</span>
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover a la izquierda" style={mini}>←</button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === slides.length - 1} aria-label="Mover a la derecha" style={mini}>→</button>
                <button type="button" onClick={() => setSlides(current => current.filter((_, i) => i !== index))} aria-label="Quitar" style={mini}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {target === 'feed' && (
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          maxLength={2_200}
          rows={7}
          placeholder="Texto del post (hashtags incluidos)"
          style={{ fontFamily: fonts.body, fontSize: 13, padding: 10, borderRadius: radii.sm, border: `1px solid ${colors.border}`, resize: 'vertical' }}
        />
      )}

      {badRatio && (
        <div style={{ fontSize: 12, color: colors.accent }}>
          {target === 'story' ? 'Las historias deben ser 9:16 (1080×1920).' : 'Instagram acepta entre 4:5 (vertical) y 1.91:1 (horizontal); otras proporciones las recorta.'}
        </div>
      )}

      {confirming ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <span style={{ flex: 1 }}>
            ¿Publicar {target === 'story' ? 'la historia' : slides.length > 1 ? `el carrusel de ${slides.length} imágenes` : 'el post'} en Instagram? Se publica de inmediato.
          </span>
          <button type="button" onClick={publish} disabled={busy} style={{ ...pill, background: colors.primary, color: '#fff' }}>{busy ? 'Enviando…' : 'Sí, publicar'}</button>
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} style={{ ...pill, background: colors.background, color: colors.navy }}>No</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={Boolean(problem)}
          title={problem ?? undefined}
          style={{ ...pill, justifySelf: 'start', padding: '10px 18px', background: problem ? colors.background : 'linear-gradient(90deg, #833AB4, #E1306C, #F77737)', color: problem ? colors.navy400 : '#fff' }}
        >
          {target === 'story' ? '📱 Publicar historia' : slides.length > 1 ? `📸 Publicar carrusel (${slides.length})` : '📸 Publicar post'}
        </button>
      )}
      {problem && slides.length > 0 && <div style={{ fontSize: 12, color: colors.navy400 }}>{problem}</div>}
      {message && <div style={{ fontSize: 13, color: message.ok ? colors.primaryDark : colors.error }}>{message.text}</div>}
    </section>
  )
}

const pill: React.CSSProperties = {
  border: 'none', borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: fonts.body,
}
const mini: React.CSSProperties = {
  border: `1px solid ${colors.border}`, background: '#fff', borderRadius: 6, padding: '0 6px', cursor: 'pointer', fontSize: 11, lineHeight: '18px',
}
