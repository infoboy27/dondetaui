import { useState } from 'react'
import { UserIcon } from './Icons'
import { authApi, isMfaChallenge, type LoginResult, type MfaChallenge } from '../api/auth'
import { ApiError } from '../api/http'
import { emitSession } from '../auth/session'
import type { MfaMethod } from '../types'

// Account messages from the API are already written for the shopper.
function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.status < 500 && error.message ? error.message : fallback
}

interface Props {
  onLogin: (email: string, password: string) => Promise<unknown>
  onRegister: (email: string, password: string, name?: string, phone?: string) => Promise<void>
  onSuccess: () => void
  loading: boolean
  error: string | null
}

// Shared by LoginScreen (mobile, full-page) and AuthModal (desktop,
// centered overlay) -- the fields/tabs/submit logic is identical, only the
// chrome around it differs.
export default function AuthForm({ onLogin, onRegister, onSuccess, loading, error }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  // Extra steps: two-step sign-in, and password recovery (email, then code).
  const [step, setStep] = useState<'form' | 'mfa' | 'forgot' | 'reset'>('form')
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null)
  const [mfaMethod, setMfaMethod] = useState<MfaMethod>('email')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [stepBusy, setStepBusy] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = async () => {
    try {
      if (tab === 'login') {
        const result = await onLogin(email, password) as LoginResult | undefined
        if (result && isMfaChallenge(result)) {
          startMfa(result)
          return
        }
      } else {
        await onRegister(email, password, name.trim() || undefined, phone.trim() || undefined)
      }
      onSuccess()
    } catch {
      /* error is already surfaced via the `error` prop */
    }
  }

  const startMfa = (result: MfaChallenge) => {
    setChallenge(result)
    setMfaMethod(result.method)
    setNotice(result.method === 'email'
      ? `Escribe el código que enviamos a ${result.emailHint ?? 'tu correo'}.`
      : 'Escribe el código de 6 dígitos de tu app autenticadora.')
    setCode('')
    setStepError(null)
    setStep('mfa')
  }

  const runStep = async (action: () => Promise<void>, fallback: string) => {
    setStepBusy(true)
    setStepError(null)
    try {
      await action()
    } catch (e) {
      setStepError(messageOf(e, fallback))
    } finally {
      setStepBusy(false)
    }
  }

  const verifyMfa = () => runStep(async () => {
    if (!challenge) return
    emitSession(await authApi.verifyMfa(challenge.challenge, code, mfaMethod))
    onSuccess()
  }, 'No pudimos verificar el código.')

  const emailMfaCode = () => runStep(async () => {
    if (!challenge) return
    const { emailHint } = await authApi.sendMfaEmail(challenge.challenge)
    setMfaMethod('email')
    setNotice(`Te enviamos un código a ${emailHint}.`)
  }, 'No pudimos enviar el código.')

  const sendReset = () => runStep(async () => {
    await authApi.forgotPassword(email.trim())
    setNotice(`Si existe una cuenta con ${email.trim()}, te enviamos un código. Escríbelo y elige una contraseña nueva.`)
    setCode('')
    setStep('reset')
  }, 'No pudimos enviar el código.')

  const resetPassword = () => runStep(async () => {
    const result = await authApi.resetPassword(email.trim(), code, newPassword)
    if (isMfaChallenge(result)) {
      startMfa(result)
      return
    }
    emitSession(result)
    onSuccess()
  }, 'No pudimos cambiar la contraseña.')

  const inputStyle = {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    fontSize: 15, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    color: '#0F1D2D',
  }

  const fieldWrapperStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#F2F4F7', borderRadius: 12,
    padding: '0 16px', height: 52,
    border: '1.5px solid #E8EDF2',
  }

  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: '#9AAABB',
    fontFamily: "'DM Sans', sans-serif",
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    display: 'block', marginBottom: 8,
  }

  const primaryButton = (label: string, onClick: () => void, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', marginTop: 20, padding: '14px 0',
        border: 'none', borderRadius: 12,
        background: disabled ? '#E8EDF2' : '#00B894',
        color: disabled ? '#9AAABB' : '#fff',
        fontSize: 14, fontWeight: 700,
        fontFamily: "'Poppins', sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  )

  const linkButton = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        display: 'block', margin: '14px auto 0', background: 'none', border: 'none', cursor: 'pointer',
        color: '#00977A', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </button>
  )

  if (step !== 'form') {
    const codeField = (
      <div style={{ marginBottom: 8 }}>
        <label htmlFor="auth-code" style={labelStyle}>Código de 6 dígitos</label>
        <div style={fieldWrapperStyle}>
          <input
            id="auth-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            onKeyDown={e => e.key === 'Enter' && code.length === 6 && (step === 'mfa' ? verifyMfa() : undefined)}
            style={{ ...inputStyle, fontSize: 22, letterSpacing: '0.4em', textAlign: 'center' as const }}
          />
        </div>
      </div>
    )
    const title = step === 'mfa' ? 'Verificación en dos pasos' : 'Recuperar contraseña'
    return (
      <>
        <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D', margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.03em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: '#5D7EA0', fontFamily: "'DM Sans', sans-serif", margin: '0 0 20px', textAlign: 'center', lineHeight: 1.5 }}>
          {step === 'forgot' ? 'Escribe el correo de tu cuenta y te enviaremos un código para elegir una contraseña nueva.' : notice}
        </p>

        {step === 'forgot' && (
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="auth-forgot-email" style={labelStyle}>Correo</label>
            <div style={fieldWrapperStyle}>
              <input id="auth-forgot-email" type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com" onKeyDown={e => e.key === 'Enter' && sendReset()} style={inputStyle} />
            </div>
          </div>
        )}
        {(step === 'mfa' || step === 'reset') && codeField}
        {step === 'reset' && (
          <div style={{ marginTop: 16 }}>
            <label htmlFor="auth-new-password" style={labelStyle}>Nueva contraseña (mínimo 8 caracteres)</label>
            <div style={fieldWrapperStyle}>
              <input id="auth-new-password" type="password" autoComplete="new-password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && resetPassword()} style={inputStyle} />
            </div>
          </div>
        )}

        {stepError && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FF3B3B30', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 12, color: '#FF3B3B', fontFamily: "'DM Sans', sans-serif" }}>
            {stepError}
          </div>
        )}

        {step === 'mfa' && primaryButton(stepBusy ? 'Verificando…' : 'Continuar', () => void verifyMfa(), stepBusy || code.length !== 6)}
        {step === 'forgot' && primaryButton(stepBusy ? 'Enviando…' : 'Enviar código', () => void sendReset(), stepBusy || !/\S+@\S+\.\S+/.test(email.trim()))}
        {step === 'reset' && primaryButton(stepBusy ? 'Guardando…' : 'Cambiar contraseña', () => void resetPassword(), stepBusy || code.length !== 6 || newPassword.length < 8)}

        {step === 'mfa' && mfaMethod === 'totp' && linkButton('¿No tienes tu teléfono? Recibir código por correo', () => void emailMfaCode())}
        {step === 'mfa' && mfaMethod === 'email' && linkButton('Reenviar código', () => void emailMfaCode())}
        {step === 'reset' && linkButton('Reenviar código', () => void sendReset())}
        {linkButton('Volver', () => { setStep('form'); setStepError(null) })}
      </>
    )
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00B894 0%, #00cba0 100%)',
          margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,184,148,0.25)',
        }}>
          <UserIcon size={28} color="#fff" />
        </div>
        <h1 style={{
          fontSize: 20, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D', margin: '0 0 4px',
          letterSpacing: '-0.03em',
        }}>
          {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
        <p style={{
          fontSize: 13, color: '#9AAABB',
          fontFamily: "'DM Sans', sans-serif",
          margin: '0 0 20px',
        }}>
          Guarda tus favoritos y alertas en tu cuenta de DóndeTa.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E8EDF2', marginBottom: 20 }}>
        {(['login', 'register'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '12px 0',
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2.5px solid #00B894' : '2.5px solid transparent',
              fontSize: 13, fontWeight: tab === t ? 700 : 400,
              fontFamily: "'Poppins', sans-serif",
              color: tab === t ? '#00B894' : '#9AAABB',
            }}
          >
            {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      {tab === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="auth-name" style={labelStyle}>Nombre (opcional)</label>
          <div style={fieldWrapperStyle}>
            <input
              id="auth-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Carlos Almonte"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {tab === 'register' && (
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="auth-phone" style={labelStyle}>Teléfono (opcional, para WhatsApp/SMS)</label>
          <div style={fieldWrapperStyle}>
            <input
              id="auth-phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 809 555 0100"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="auth-email" style={labelStyle}>Correo</label>
        <div style={fieldWrapperStyle}>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label htmlFor="auth-password" style={labelStyle}>Contraseña</label>
        <div style={fieldWrapperStyle}>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FFF0F0', border: '1px solid #FF3B3B30', borderRadius: 10,
          padding: '10px 14px', marginTop: 8,
          fontSize: 12, color: '#FF3B3B',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !email || !password}
        style={{
          width: '100%', marginTop: 20, padding: '14px 0',
          border: 'none', borderRadius: 12,
          background: loading || !email || !password ? '#E8EDF2' : '#00B894',
          color: loading || !email || !password ? '#9AAABB' : '#fff',
          fontSize: 14, fontWeight: 700,
          fontFamily: "'Poppins', sans-serif",
          cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
          boxShadow: loading || !email || !password ? 'none' : '0 4px 12px rgba(0,184,148,0.3)',
        }}
      >
        {loading ? 'Cargando…' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
      </button>
      {tab === 'login' && linkButton('¿Olvidaste tu contraseña?', () => { setStep('forgot'); setStepError(null) })}
    </>
  )
}
