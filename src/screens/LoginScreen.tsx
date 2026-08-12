import { ChevronLeft } from '../components/Icons'
import AuthForm from '../components/AuthForm'

interface Props {
  onBack: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string, name?: string, phone?: string) => Promise<void>
  loading: boolean
  error: string | null
}

export default function LoginScreen({ onBack, onLogin, onRegister, loading, error }: Props) {
  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      <div style={{
        background: '#fff', padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #E8EDF2',
      }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#F2F4F7', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} color="#0F1D2D" />
        </button>
        <span style={{
          fontSize: 15, fontWeight: 600,
          fontFamily: "'Poppins', sans-serif",
          color: '#0F1D2D',
        }}>
          Mi cuenta
        </span>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <AuthForm onLogin={onLogin} onRegister={onRegister} onSuccess={onBack} loading={loading} error={error} />
      </div>
    </div>
  )
}
