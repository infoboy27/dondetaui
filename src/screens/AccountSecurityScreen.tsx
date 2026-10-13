import { useState, type CSSProperties, type ReactNode } from 'react'
import QRCode from 'qrcode'
import { authApi } from '../api/auth'
import { ApiError } from '../api/http'
import { emitSession } from '../auth/session'
import { ChevronLeft, ShieldIcon } from '../components/Icons'
import type { User } from '../types'

// /cuenta/seguridad: confirm email, change password, two-step verification,
// sign out everywhere, delete account. Also the public "how to delete your
// account" page that Google Play asks for.

interface Props {
  user: User | null
  onBack: () => void
  onLogin: () => void
  onDeleted: () => void
}

const FONT = "'DM Sans', sans-serif"
const DISPLAY = "'Poppins', sans-serif"
const MFA_LABEL = { email: 'código por correo', totp: 'app autenticadora' } as const

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.status < 500 && error.message ? error.message : fallback
}

const input: CSSProperties = {
  width: '100%', boxSizing: 'border-box', height: 46, borderRadius: 10, border: '1.5px solid #E8EDF2',
  background: '#F7F9FB', padding: '0 14px', fontSize: 15, fontFamily: FONT, color: '#0F1D2D', outline: 'none', marginTop: 8,
}

function button(kind: 'primary' | 'secondary' | 'danger', disabled = false): CSSProperties {
  const colors = { primary: ['#00B894', '#fff'], secondary: ['#E6F7F3', '#00977A'], danger: ['#D9363E', '#fff'] }[kind]
  return {
    marginTop: 12, padding: '11px 18px', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700,
    fontFamily: DISPLAY, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
    background: colors[0], color: colors[1],
  }
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #E8EDF2' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY, color: '#0F1D2D', margin: '0 0 6px' }}>{title}</h2>
      {children}
    </section>
  )
}

function Text({ children, muted = true }: { children: ReactNode; muted?: boolean }) {
  return <p style={{ fontSize: 14, lineHeight: 1.5, fontFamily: FONT, color: muted ? '#5D7EA0' : '#0F1D2D', margin: '0 0 4px' }}>{children}</p>
}

function Feedback({ error, ok }: { error: string | null; ok: string | null }) {
  if (!error && !ok) return null
  return <p role="status" style={{ fontSize: 13, fontFamily: FONT, margin: '10px 0 0', color: error ? '#D9363E' : '#00977A' }}>{error ?? ok}</p>
}

// Runs an account action with busy/error/success state.
function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const run = async (action: () => Promise<string | void>, fallback: string) => {
    setBusy(true)
    setError(null)
    setOk(null)
    try {
      const message = await action()
      if (message) setOk(message)
    } catch (e) {
      setError(messageOf(e, fallback))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, ok, run }
}

function EmailSection({ user }: { user: User }) {
  const { busy, error, ok, run } = useAction()
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  if (user.emailVerified) {
    return <Card title="Correo"><Text muted={false}>{user.email}</Text><Text>✓ Confirmado</Text></Card>
  }
  return (
    <Card title="Correo">
      <Text muted={false}>{user.email}</Text>
      <Text>Confírmalo para poder recuperar tu cuenta y recibir códigos por correo.</Text>
      {sent && <input style={input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Código de 6 dígitos"
        value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sent && <button style={button('primary', busy || code.length !== 6)} disabled={busy || code.length !== 6}
          onClick={() => run(async () => { emitSession({ user: await authApi.verifyEmail(code) }) }, 'No pudimos confirmar el correo.')}>Confirmar</button>}
        <button style={button(sent ? 'secondary' : 'primary', busy)} disabled={busy}
          onClick={() => run(async () => { await authApi.sendVerification(); setSent(true); return 'Te enviamos un código.' }, 'No pudimos enviar el código.')}>
          {sent ? 'Reenviar código' : 'Enviar código'}
        </button>
      </div>
      <Feedback error={error} ok={ok} />
    </Card>
  )
}

function PasswordSection() {
  const { busy, error, ok, run } = useAction()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  return (
    <Card title="Contraseña">
      <Text>Al cambiarla se cierra la sesión en tus otros dispositivos.</Text>
      <input style={input} type="password" autoComplete="current-password" placeholder="Contraseña actual" value={current} onChange={e => setCurrent(e.target.value)} />
      <input style={input} type="password" autoComplete="new-password" placeholder="Nueva contraseña (mínimo 8)" value={next} onChange={e => setNext(e.target.value)} />
      <button style={button('primary', busy || !current || next.length < 8)} disabled={busy || !current || next.length < 8}
        onClick={() => run(async () => {
          emitSession(await authApi.changePassword(current, next))
          setCurrent('')
          setNext('')
          return 'Contraseña cambiada.'
        }, 'No pudimos cambiar la contraseña.')}>Cambiar contraseña</button>
      <Feedback error={error} ok={ok} />
    </Card>
  )
}

function TwoFactorSection({ user }: { user: User }) {
  const { busy, error, ok, run } = useAction()
  const [action, setAction] = useState<'email' | 'totp' | 'disable' | null>(null)
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState<{ secret: string | null; qr: string | null } | null>(null)
  const [code, setCode] = useState('')

  const reset = () => { setAction(null); setPassword(''); setTotp(null); setCode('') }

  const confirm = () => run(async () => {
    if (action === 'email') {
      emitSession({ user: await authApi.enableEmailMfa(password) })
      reset()
      return 'Verificación por correo activada.'
    }
    if (action === 'disable') {
      emitSession({ user: await authApi.disableMfa(password) })
      reset()
      return 'Verificación en dos pasos desactivada.'
    }
    const setup = await authApi.setupTotp(password)
    setPassword('')
    setTotp({ secret: setup.secret, qr: setup.otpauthUrl ? await QRCode.toDataURL(setup.otpauthUrl, { width: 200, margin: 1 }) : null })
  }, 'No pudimos guardar el cambio.')

  const enableTotp = () => run(async () => {
    emitSession({ user: await authApi.enableTotp(code) })
    reset()
    return 'App autenticadora activada.'
  }, 'No pudimos verificar el código.')

  return (
    <Card title="Verificación en dos pasos">
      <Text>
        {user.mfaMethod
          ? `Activada: al iniciar sesión te pedimos tu contraseña y un ${MFA_LABEL[user.mfaMethod]}.`
          : 'Agrega un segundo paso al iniciar sesión: aunque alguien sepa tu contraseña, no podrá entrar sin el código.'}
      </Text>

      {!action && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {user.mfaMethod ? (
            <button style={button('secondary')} onClick={() => setAction('disable')}>Desactivar</button>
          ) : (
            <>
              <button style={button('primary', !user.emailVerified)} disabled={!user.emailVerified} title={user.emailVerified ? undefined : 'Primero confirma tu correo'}
                onClick={() => setAction('email')}>Código por correo</button>
              <button style={button('secondary')} onClick={() => setAction('totp')}>App autenticadora</button>
            </>
          )}
        </div>
      )}

      {action && !totp && (
        <>
          <input style={input} type="password" autoComplete="current-password" autoFocus placeholder="Escribe tu contraseña para continuar"
            value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && password && confirm()} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={button('primary', busy || !password)} disabled={busy || !password} onClick={() => void confirm()}>Continuar</button>
            <button style={button('secondary')} onClick={reset}>Cancelar</button>
          </div>
        </>
      )}

      {totp && (
        <>
          {totp.secret ? (
            <>
              <Text muted={false}>1. Escanea este código con tu app autenticadora (Google Authenticator, Authy, 1Password…):</Text>
              {totp.qr && <img src={totp.qr} alt="Código QR para la app autenticadora" width={200} height={200} style={{ display: 'block', margin: '12px 0' }} />}
              <Text>O escribe esta clave: <code style={{ fontSize: 14, letterSpacing: 1 }}>{totp.secret.match(/.{1,4}/g)?.join(' ')}</code></Text>
              <Text muted={false}>2. Escribe el código de 6 dígitos que muestra:</Text>
            </>
          ) : (
            <Text muted={false}>Tu cuenta ya tiene una app autenticadora. Escribe el código de DóndeTa que muestra:</Text>
          )}
          <input style={input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={button('primary', busy || code.length !== 6)} disabled={busy || code.length !== 6} onClick={() => void enableTotp()}>Activar</button>
            <button style={button('secondary')} onClick={reset}>Cancelar</button>
          </div>
        </>
      )}
      <Feedback error={error} ok={ok} />
    </Card>
  )
}

function SessionsSection() {
  const { busy, error, ok, run } = useAction()
  return (
    <Card title="Sesiones">
      <Text>Cierra la sesión en todos tus dispositivos, por ejemplo si entraste desde una computadora que no es tuya.</Text>
      <button style={button('secondary', busy)} disabled={busy}
        onClick={() => {
          if (!window.confirm('¿Cerrar la sesión en todos tus otros dispositivos?')) return
          void run(async () => { emitSession(await authApi.logoutEverywhere()); return 'Cerramos la sesión en tus otros dispositivos.' }, 'No pudimos cerrar las sesiones.')
        }}>Cerrar sesión en todos los dispositivos</button>
      <Feedback error={error} ok={ok} />
    </Card>
  )
}

function DeleteSection({ onDeleted }: { onDeleted: () => void }) {
  const { busy, error, ok, run } = useAction()
  const [password, setPassword] = useState('')
  return (
    <Card title="Eliminar cuenta">
      <Text>Se borran para siempre tu cuenta, tus favoritos, alertas, reseñas e historial de búsquedas. Puedes seguir usando DóndeTa sin cuenta.</Text>
      <input style={input} type="password" autoComplete="current-password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
      <button style={button('danger', busy || !password)} disabled={busy || !password}
        onClick={() => {
          if (!window.confirm('¿Eliminar tu cuenta? Esto no se puede deshacer.')) return
          void run(async () => {
            await authApi.deleteAccount(password)
            emitSession(null)
            onDeleted()
          }, 'No pudimos eliminar la cuenta.')
        }}>Eliminar mi cuenta</button>
      <Feedback error={error} ok={ok} />
    </Card>
  )
}

export default function AccountSecurityScreen({ user, onBack, onLogin, onDeleted }: Props) {
  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E8EDF2' }}>
        <button onClick={onBack} aria-label="Volver" style={{ width: 36, height: 36, borderRadius: 10, background: '#F2F4F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="#0F1D2D" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: DISPLAY, color: '#0F1D2D' }}>Seguridad de la cuenta</span>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 0' }}>
        {user ? (
          <>
            <EmailSection user={user} />
            <PasswordSection />
            <TwoFactorSection user={user} />
            <SessionsSection />
            <DeleteSection onDeleted={onDeleted} />
          </>
        ) : (
          <Card title="Inicia sesión para continuar">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <ShieldIcon size={20} color="#00B894" />
              <div>
                <Text>Aquí puedes confirmar tu correo, cambiar tu contraseña, activar la verificación en dos pasos y eliminar tu cuenta.</Text>
                <Text>Para eliminar tu cuenta y todos sus datos, inicia sesión y usa «Eliminar cuenta». Si no puedes entrar, usa «¿Olvidaste tu contraseña?» o escríbenos desde la página de contacto.</Text>
              </div>
            </div>
            <button style={button('primary')} onClick={onLogin}>Iniciar sesión</button>
          </Card>
        )}
      </div>
    </div>
  )
}
