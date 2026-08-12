import { useEffect } from 'react'
import { XIcon } from './Icons'
import AuthForm from './AuthForm'

interface Props {
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, name?: string, phone?: string) => Promise<void>
  loading: boolean
  error: string | null
}

// Desktop's own login/register dialog. Desktop previously had no login
// screen of its own -- "not logged in" switched the whole app into the
// mobile phone-frame preview just to reach LoginScreen there, which read as
// a jarring, unexplained view change rather than a login prompt.
export default function AuthModal({ onClose, onLogin, onRegister, loading, error }: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 29, 45, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Iniciar sesión o crear cuenta"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20,
          width: '100%', maxWidth: 400,
          padding: '20px 28px 28px',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(15, 29, 45, 0.25)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: 10,
            background: '#F2F4F7', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <XIcon size={16} color="#5d7ea0" />
        </button>

        <div style={{ marginTop: 24 }}>
          <AuthForm onLogin={onLogin} onRegister={onRegister} onSuccess={onClose} loading={loading} error={error} />
        </div>
      </div>
    </div>
  )
}
