import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { adminApi } from '../../api/admin'
import { colors, fonts, radii } from '../../design/tokens'

// Second step for the portal: scan once (setup), then a 6-digit code from the
// authenticator app every 12 h (verify). On success the API returns an admin
// token that replaces the plain password session.
export default function AdminMfa({ mode, onDone, onLogout }: {
  mode: 'setup' | 'verify'
  onDone: (token: string) => void
  onLogout: () => void
}) {
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode !== 'setup') return
    adminApi.mfaSetup()
      .then(async result => {
        setSecret(result.secret)
        setQr(await QRCode.toDataURL(result.otpauthUrl, { width: 220, margin: 1 }))
      })
      .catch(err => setError(err instanceof Error ? err.message : String(err)))
  }, [mode])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { token } = mode === 'setup' ? await adminApi.mfaEnable(code) : await adminApi.mfaVerify(code)
      onDone(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: fonts.body }}>
      <form onSubmit={submit} style={{ background: colors.card, borderRadius: radii.xl, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 8px 24px rgba(15,29,45,0.10)', display: 'grid', gap: 14, color: colors.navy }}>
        <div>
          <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 22 }}>DóndeTa Admin</div>
          <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16, marginTop: 4 }}>
            {mode === 'setup' ? 'Activa la verificación en dos pasos' : 'Verificación en dos pasos'}
          </div>
        </div>

        {mode === 'setup' ? (
          <>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: colors.navy600, display: 'grid', gap: 6, lineHeight: 1.45 }}>
              <li>Instala <b>Google Authenticator</b> (o Authy) en tu celular.</li>
              <li>Toca <b>+</b> → <b>Escanear código QR</b> y escanea este código.</li>
              <li>Escribe el código de 6 dígitos que aparece en la app.</li>
            </ol>
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 220 }}>
              {qr ? <img src={qr} alt="Código QR para la app de autenticación" width={220} height={220} /> : <span style={{ alignSelf: 'center', color: colors.navy400 }}>Generando código…</span>}
            </div>
            {secret && (
              <div style={{ fontSize: 12, color: colors.navy400, textAlign: 'center' }}>
                ¿No puedes escanear? Ingresa esta clave a mano:<br />
                <code style={{ fontSize: 13, color: colors.navy, letterSpacing: '0.08em', wordBreak: 'break-all' }}>{secret.replace(/(.{4})/g, '$1 ').trim()}</code>
              </div>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: colors.navy600 }}>
            Abre Google Authenticator y escribe el código de 6 dígitos de <b>DóndeTa Admin</b>.
          </p>
        )}

        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={7}
          value={code}
          onChange={event => setCode(event.target.value.replace(/[^\d ]/g, ''))}
          placeholder="123 456"
          aria-label="Código de 6 dígitos"
          style={{ fontSize: 26, letterSpacing: '0.3em', textAlign: 'center', padding: '12px 10px', borderRadius: radii.md, border: `1.5px solid ${colors.border}`, fontFamily: fonts.display }}
        />
        {error && <div style={{ color: colors.error, fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={busy || code.replace(/\s/g, '').length !== 6} style={{
          background: colors.primary, color: '#fff', border: 'none', borderRadius: radii.md, padding: '12px 16px',
          fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: fonts.display,
          opacity: busy || code.replace(/\s/g, '').length !== 6 ? 0.5 : 1,
        }}>
          {busy ? 'Verificando…' : mode === 'setup' ? 'Activar y entrar' : 'Entrar'}
        </button>
        <button type="button" onClick={onLogout} style={{ background: 'none', border: 'none', color: colors.navy400, cursor: 'pointer', fontSize: 13 }}>
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}
