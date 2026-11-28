import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, type PushBroadcastResult, type PushDevices } from '../../api/admin'
import { colors, fonts, radii } from '../../design/tokens'

// Hard caps match parseBroadcast in apps/api (push-messages.ts); the soft ones
// are what an iPhone lock screen shows before cutting the text.
const TITLE = { soft: 40, max: 65 }
const BODY = { soft: 120, max: 178 }
const length = (text: string) => [...text].length

const field: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: `1px solid ${colors.border}`, borderRadius: radii.sm,
  padding: '10px 12px', fontFamily: fonts.body, fontSize: 15, color: colors.navy, background: colors.card,
}

// /admin/notificaciones: one-off push to every phone that turned on
// "Ofertas y recordatorios" in the app (Dominican Republic stack only).
export default function AdminPush() {
  const [devices, setDevices] = useState<PushDevices | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<PushBroadcastResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDevices = () => adminApi.pushDevices().then(setDevices).catch(err => setError(err instanceof Error ? err.message : String(err)))
  useEffect(() => { void loadDevices() }, [])

  const cleanTitle = title.trim()
  const cleanBody = body.trim()
  const tooLong = length(cleanTitle) > TITLE.max || length(cleanBody) > BODY.max
  const canSend = !sending && !!cleanTitle && !!cleanBody && !tooLong && !!devices?.total

  const send = async () => {
    if (!devices || !canSend) return
    const phones = devices.total === 1 ? '1 teléfono' : `${devices.total} teléfonos`
    if (!window.confirm(`¿Enviar ahora a ${phones}?\n\n${cleanTitle}\n${cleanBody}\n\nNo se puede deshacer.`)) return
    setSending(true)
    setError(null)
    setResult(null)
    try {
      setResult(await adminApi.broadcastPush(cleanTitle, cleanBody))
      setTitle('')
      setBody('')
      void loadDevices()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, fontFamily: fonts.body, color: colors.navy }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 64px' }}>
        <Link to="/admin" style={{ color: colors.primary, fontSize: 14 }}>← Volver</Link>
        <h1 style={{ fontFamily: fonts.display, fontSize: 24, margin: '12px 0 4px' }}>Enviar notificación</h1>
        <p style={{ color: colors.navy400, fontSize: 14, marginTop: 0 }}>
          Llega solo a los teléfonos que activaron <strong>Ofertas y recordatorios</strong> en la app (iPhone y Android)
          de República Dominicana; así lo exige Apple. Al tocarla se abre la app en el inicio.
        </p>

        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.lg, padding: 16, marginBottom: 16, fontSize: 14 }}>
          {devices === null ? 'Contando teléfonos…' : (
            <>
              <strong style={{ fontFamily: fonts.display, fontSize: 20 }}>{devices.total}</strong> {devices.total === 1 ? 'teléfono aceptó ofertas' : 'teléfonos aceptaron ofertas'}
              <span style={{ color: colors.navy400 }}> · iPhone {devices.ios} · Android {devices.android}</span>
            </>
          )}
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Black Friday y Cyber Monday 🛍️" style={field} />
        <Counter text={cleanTitle} limits={TITLE} />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, margin: '14px 0 6px' }}>Mensaje</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Recuerda comparar tus precios en DóndeTa antes de comprar." style={{ ...field, resize: 'vertical' }} />
        <Counter text={cleanBody} limits={BODY} />

        <div style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 8px' }}>Así se verá</div>
        <div style={{ background: '#1C2735', borderRadius: 22, padding: 18 }}>
          <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: colors.primary, color: '#fff', fontFamily: fonts.display, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>D</div>
            <div style={{ minWidth: 0, flex: 1, fontSize: 14, lineHeight: 1.3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cleanTitle || 'Título'}</strong>
                <span style={{ color: '#6B7785', fontSize: 12, flexShrink: 0 }}>ahora</span>
              </div>
              <div style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#222' }}>{cleanBody || 'Mensaje'}</div>
            </div>
          </div>
        </div>

        {error && <p style={{ color: '#D64545', fontSize: 14 }}>{error}</p>}
        {result && (
          <p style={{ color: colors.primaryDark, fontSize: 14, fontWeight: 600 }}>
            ✅ Enviada: {result.accepted} de {result.devices} aceptada{result.accepted === 1 ? '' : 's'}
            {result.disabled ? ` · ${result.disabled} teléfono(s) ya no existen y se quitaron` : ''}
          </p>
        )}

        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          style={{
            marginTop: 18, width: '100%', border: 'none', borderRadius: radii.full, padding: '14px 18px',
            background: canSend ? colors.primary : colors.border, color: canSend ? '#fff' : colors.navy400,
            fontFamily: fonts.display, fontWeight: 700, fontSize: 15, cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          {sending ? 'Enviando…' : devices?.total ? `Enviar a ${devices.total === 1 ? '1 teléfono' : `${devices.total} teléfonos`}` : 'Nadie ha activado los avisos todavía'}
        </button>
      </div>
    </div>
  )
}

function Counter({ text, limits }: { text: string; limits: { soft: number; max: number } }) {
  const n = length(text)
  const color = n > limits.max ? '#D64545' : n > limits.soft ? colors.accent : colors.navy400
  const note = n > limits.max ? ' · demasiado largo' : n > limits.soft ? ' · el iPhone puede cortarlo' : ''
  return <div style={{ fontSize: 12, color, marginTop: 4, textAlign: 'right' }}>{n}/{limits.max}{note}</div>
}
