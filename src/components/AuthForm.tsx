import { useState } from 'react'
import { UserIcon } from './Icons'

interface Props {
  onLogin: (email: string, password: string) => Promise<void>
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = async () => {
    try {
      if (tab === 'login') {
        await onLogin(email, password)
      } else {
        await onRegister(email, password, name.trim() || undefined, phone.trim() || undefined)
      }
      onSuccess()
    } catch {
      /* error is already surfaced via the `error` prop */
    }
  }

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
    </>
  )
}
