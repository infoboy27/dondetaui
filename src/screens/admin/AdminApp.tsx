import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import AuthForm from '../../components/AuthForm'
import { adminApi } from '../../api/admin'
import { ApiError } from '../../api/http'
import { appConfig } from '../../config/env'
import { colors, fonts, radii, shadows } from '../../design/tokens'
import type { User } from '../../types'
import AdminDashboard from './AdminDashboard'
import AdminReport from './AdminReport'
import AdminInstagram from './AdminInstagram'
import AdminMfa from './AdminMfa'
import { setToken } from '../../auth/session'

interface Props {
  user: User | null
  authLoading: boolean
  authError: string | null
  onLogin: (email: string, password: string) => Promise<unknown>
  onRegister: (email: string, password: string, name?: string, phone?: string) => Promise<void>
  onLogout: () => void
}

type Access = 'checking' | 'granted' | 'denied' | 'mfa_setup' | 'mfa_verify' | 'error'

// /admin/*: the owner's portal -- metrics plus a printable proposal per store.
// Rendered full-screen outside the phone frame / DesktopView. The API decides
// who gets in (ADMIN_EMAILS); this only asks it.
export default function AdminApp({ user, authLoading, authError, onLogin, onRegister, onLogout }: Props) {
  const [access, setAccess] = useState<Access>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setAccess('checking')
    adminApi.me()
      .then(() => { if (!cancelled) setAccess('granted') })
      .catch(error => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) return onLogout() // expired 12 h admin session
        if (error instanceof ApiError && error.status === 403) {
          setAccess(error.message === 'mfa_setup_required' ? 'mfa_setup' : error.message === 'mfa_required' ? 'mfa_verify' : 'denied')
          return
        }
        setAccess('error')
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, attempt])

  if (!appConfig.useApi) {
    return <Gate title="Portal de administrador">Este portal necesita la API en vivo (VITE_USE_API=true).</Gate>
  }

  if (!user) {
    return (
      <Gate title="Portal de administrador">
        {authLoading ? 'Cargando…' : (
          <AuthForm onLogin={onLogin} onRegister={onRegister} onSuccess={() => {}} loading={authLoading} error={authError} />
        )}
      </Gate>
    )
  }

  if (access === 'checking') return <Gate title="Portal de administrador">Verificando acceso…</Gate>
  if (access === 'mfa_setup' || access === 'mfa_verify') {
    return (
      <AdminMfa
        mode={access === 'mfa_setup' ? 'setup' : 'verify'}
        onLogout={onLogout}
        onDone={token => {
          setToken(token)
          setAttempt(n => n + 1)
        }}
      />
    )
  }
  if (access !== 'granted') {
    return (
      <Gate title="Sin acceso">
        <p style={{ margin: '0 0 16px' }}>
          {access === 'denied'
            ? `La cuenta ${user.email} no está autorizada. Agrégala a ADMIN_EMAILS en el .env del servidor.`
            : 'No se pudo contactar la API. Intenta de nuevo en un momento.'}
        </p>
        <button type="button" onClick={onLogout} style={linkButton}>Cerrar sesión</button>
      </Gate>
    )
  }

  return (
    <Routes>
      <Route path="reporte/:slug" element={<AdminReport />} />
      <Route path="instagram" element={<AdminInstagram />} />
      <Route path="*" element={<AdminDashboard user={user} onLogout={onLogout} />} />
    </Routes>
  )
}

function Gate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: colors.card, borderRadius: radii.xl, boxShadow: shadows.lg, padding: 28, width: '100%', maxWidth: 420, fontFamily: fonts.body, color: colors.navy400, fontSize: 14 }}>
        <div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 22, color: colors.navy, marginBottom: 4 }}>DóndeTa</div>
        <div style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 16, color: colors.navy, marginBottom: 16 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

const linkButton: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, color: colors.primary, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.body, fontSize: 14,
}
