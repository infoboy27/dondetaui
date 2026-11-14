import { useState } from 'react'
import { REPORT_OPTIONS, type ReportReason } from '../domain/reviewBlocks'

// "Reportar" and "Ocultar reseñas de este usuario" under each review
// (user-generated content rules: report + block). Reporting needs a session;
// hiding works for anyone.
export default function ReviewActions({ authorKey, isLoggedIn, onRequireLogin, onReport, onHideAuthor }: {
  authorKey?: string
  isLoggedIn: boolean
  onRequireLogin: () => void
  onReport: (reason: ReportReason) => Promise<void>
  onHideAuthor: (authorKey: string) => void
}) {
  const [choosing, setChoosing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const link = {
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    fontSize: 11.5, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline',
  } as const

  if (status === 'done') {
    return <p style={{ ...link, textDecoration: 'none', margin: '6px 0 0' }}>Gracias. La revisaremos en menos de 24 horas.</p>
  }

  const send = async (reason: ReportReason) => {
    setStatus('sending')
    try {
      await onReport(reason)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ marginTop: 6 }}>
      {!choosing ? (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button type="button" style={link} onClick={() => (isLoggedIn ? setChoosing(true) : onRequireLogin())}>
            Reportar
          </button>
          {authorKey && (
            <button type="button" style={link} onClick={() => onHideAuthor(authorKey)}>
              Ocultar reseñas de este usuario
            </button>
          )}
        </div>
      ) : (
        <div role="group" aria-label="Motivo del reporte" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...link, textDecoration: 'none', cursor: 'default' }}>¿Por qué?</span>
          {REPORT_OPTIONS.map(option => (
            <button
              key={option.reason}
              type="button"
              disabled={status === 'sending'}
              onClick={() => void send(option.reason)}
              style={{
                border: '1px solid #E8EDF2', borderRadius: 999, background: '#fff', padding: '3px 9px', cursor: 'pointer',
                fontSize: 11.5, color: '#0F1D2D', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {option.label}
            </button>
          ))}
          <button type="button" style={link} onClick={() => setChoosing(false)}>Cancelar</button>
          {status === 'error' && <span style={{ fontSize: 11.5, color: '#D64545' }}>No se pudo enviar. Intenta de nuevo.</span>}
        </div>
      )}
    </div>
  )
}
