import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { digestsApi } from '../api/digests'
import { ApiError } from '../api/http'
import AuthForm from '../components/AuthForm'
import { BellIcon, ChevronLeft } from '../components/Icons'
import type { User } from '../types'

// /cuenta/black-friday: sign up for "las ofertas reales de Black Friday" by
// email. The landing page for the Instagram ad and the /black-friday CTA:
//   /cuenta/black-friday?activar=1  -> create an account (or sign in) and get
//                                      subscribed right away;
//   /cuenta/black-friday            -> manage it (linked from Perfil);
//   /cuenta/black-friday?baja=TOKEN -> one-click unsubscribe from the email.

interface Props {
  user: User | null
  onBack: () => void
  onLogin: (email: string, password: string) => Promise<unknown>
  onRegister: (email: string, password: string, name?: string, phone?: string) => Promise<void>
  authLoading: boolean
  authError: string | null
}

const FONT = "'DM Sans', sans-serif"
const DISPLAY = "'Poppins', sans-serif"

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <section style={{ background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid #E8EDF2', ...style }}>{children}</section>
}

function Text({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return <p style={{ fontSize: 14, lineHeight: 1.55, fontFamily: FONT, color: strong ? '#0F1D2D' : '#5D7EA0', margin: '0 0 8px' }}>{children}</p>
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.status < 500 && error.message ? error.message : fallback
}

function Toggle({ on, disabled, onChange }: { on: boolean; disabled: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label="Ofertas reales de Black Friday por correo"
      disabled={disabled}
      onClick={() => onChange(!on)}
      style={{
        width: 52, height: 30, borderRadius: 999, border: 'none', padding: 3, flexShrink: 0,
        background: on ? '#00B894' : '#C9D3DD', cursor: disabled ? 'wait' : 'pointer', transition: 'background .15s',
        display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
      }}
    >
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(15,29,45,.25)' }} />
    </button>
  )
}

export default function BlackFridayDigestScreen({ user, onBack, onLogin, onRegister, authLoading, authError }: Props) {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('baja')
  const wantsSignup = params.get('activar') === '1'

  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSubscribed, setJustSubscribed] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState<'pending' | 'done' | 'failed'>('pending')
  const autoSubscribed = useRef(false)

  // One-click unsubscribe from the email.
  useEffect(() => {
    if (!token) return
    digestsApi.unsubscribeByToken(token).then(() => setUnsubscribed('done'), () => setUnsubscribed('failed'))
  }, [token])

  // Signed in: load the status, and subscribe straight away when arriving
  // from the ad / the /black-friday button (?activar=1).
  useEffect(() => {
    if (!user || token) return
    let cancelled = false
    const load = async () => {
      try {
        let on = await digestsApi.status('black-friday')
        if (!on && wantsSignup && !autoSubscribed.current) {
          autoSubscribed.current = true
          on = await digestsApi.subscribe('black-friday')
          if (!cancelled) setJustSubscribed(true)
          window.gtag?.('event', 'sign_up_digest', { topic: 'black-friday' })
        }
        if (!cancelled) setSubscribed(on)
      } catch (e) {
        if (!cancelled) setError(messageOf(e, 'No pudimos cargar tu suscripción. Intenta de nuevo.'))
      }
    }
    void load()
    return () => { cancelled = true }
  }, [user, token, wantsSignup])

  const change = async (next: boolean) => {
    setBusy(true)
    setError(null)
    try {
      setSubscribed(next ? await digestsApi.subscribe('black-friday') : await digestsApi.unsubscribe('black-friday'))
      setJustSubscribed(next)
    } catch (e) {
      setError(messageOf(e, 'No pudimos guardar el cambio. Intenta de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  let body: ReactNode
  if (token) {
    body = (
      <Card>
        <Text strong>
          {unsubscribed === 'pending' ? 'Un momento…' : unsubscribed === 'done'
            ? 'Listo: ya no te enviaremos las ofertas de Black Friday por correo.'
            : 'Este enlace no es válido o ya venció. Inicia sesión y desactívalo aquí mismo.'}
        </Text>
        {unsubscribed === 'done' && <Text>Si cambias de opinión, puedes volver a activarlas desde Perfil.</Text>}
      </Card>
    )
  } else if (!user) {
    body = (
      <>
        <Pitch />
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY, color: '#0F1D2D', margin: '0 0 12px' }}>Crea tu cuenta gratis para recibirlas</h2>
          <AuthForm onLogin={onLogin} onRegister={onRegister} onSuccess={() => {}} loading={authLoading} error={authError} initialTab="register" />
        </Card>
      </>
    )
  } else {
    body = (
      <>
        {justSubscribed && subscribed && (
          <Card style={{ background: '#E6F7F3', borderColor: '#CDEFE7' }}>
            <Text strong>¡Listo! Te enviaremos a {user.email} las ofertas reales de Black Friday: el miércoles antes, el viernes y el Cyber Monday.</Text>
            {user.emailVerified === false && <Text>Confirma tu correo en Perfil → Seguridad de la cuenta para no perderte nada.</Text>}
          </Card>
        )}
        <Pitch />
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: DISPLAY, color: '#0F1D2D' }}>Ofertas reales de Black Friday por correo</div>
              <div style={{ fontSize: 13, fontFamily: FONT, color: '#5D7EA0', marginTop: 2 }}>
                {subscribed === null ? 'Cargando…' : subscribed ? 'Activado' : 'Desactivado'}
              </div>
            </div>
            <Toggle on={subscribed === true} disabled={busy || subscribed === null} onChange={on => void change(on)} />
          </div>
          {error && <p role="status" style={{ fontSize: 13, fontFamily: FONT, margin: '10px 0 0', color: '#D9363E' }}>{error}</p>}
        </Card>
        <a href="/black-friday" style={{ display: 'block', textAlign: 'center', fontFamily: FONT, fontSize: 14, fontWeight: 600, color: '#00977A', textDecoration: 'none', marginTop: 4 }}>
          Ver las ofertas de hoy ›
        </a>
      </>
    )
  }

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E8EDF2' }}>
        <button onClick={onBack} aria-label="Volver" style={{ width: 36, height: 36, borderRadius: 10, background: '#F2F4F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="#0F1D2D" />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: DISPLAY, color: '#0F1D2D' }}>Black Friday</span>
      </div>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 0' }}>{body}</div>
    </div>
  )
}

function Pitch() {
  return (
    <Card style={{ background: '#0F1D2D', borderColor: '#0F1D2D' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <BellIcon size={22} color="#FFD166" />
        <div>
          <h1 style={{ fontSize: 19, lineHeight: 1.3, fontWeight: 700, fontFamily: DISPLAY, color: '#FFD166', margin: '0 0 6px' }}>
            Recibe solo las ofertas reales de Black Friday
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, fontFamily: FONT, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            Comparamos cada precio con su propio historial de los últimos 30 días. Si una tienda lo subió antes para “rebajarlo”, no te llega.
            Te escribimos el miércoles antes, el viernes y el Cyber Monday: como mucho un correo al día, y te das de baja con un clic.
          </p>
        </div>
      </div>
    </Card>
  )
}
