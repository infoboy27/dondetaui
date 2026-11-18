import { useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '../api/http'
import { notificationPrefsApi, savedSearchesApi } from '../api/notificationPrefs'
import { BellIcon, ChevronLeft, XIcon } from '../components/Icons'
import {
  ALERT_TYPES,
  PROMOTIONAL_TYPES,
  withPref,
  type NotificationPrefs,
  type NotificationType,
  type NotificationTypeInfo,
} from '../domain/notificationPrefs'
import { describeMaxPrice, type SavedSearch } from '../domain/savedSearches'
import type { User } from '../types'

// /cuenta/notificaciones: the same per-type switches as the app's Perfil ›
// Notificaciones (stored on the account, so they apply to email and push) and
// the saved searches. Promotions are opt-in and can be turned off here.

interface Props {
  user: User | null
  onBack: () => void
  onLogin: () => void
}

const FONT = "'DM Sans', sans-serif"
const DISPLAY = "'Poppins', sans-serif"

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.status < 500 && error.message ? error.message : fallback
}

function Card({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, fontFamily: FONT, color: '#5D7EA0', textTransform: 'uppercase', letterSpacing: 0.3, margin: '0 0 8px 4px' }}>{title}</h2>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8EDF2', overflow: 'hidden' }}>{children}</div>
      {footer && <p style={{ fontSize: 13, lineHeight: 1.45, fontFamily: FONT, color: '#5D7EA0', margin: '8px 4px 0' }}>{footer}</p>}
    </section>
  )
}

function Row({ children, last }: { children: ReactNode; last: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: last ? 'none' : '1px solid #E8EDF2' }}>
      {children}
    </div>
  )
}

function Toggle({ on, label, disabled, onChange }: { on: boolean; label: string; disabled: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
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

export default function NotificationPrefsScreen({ user, onBack, onLogin }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [searches, setSearches] = useState<SavedSearch[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setError(null)
    Promise.all([notificationPrefsApi.get(), savedSearchesApi.list()])
      .then(([loadedPrefs, loadedSearches]) => {
        if (cancelled) return
        setPrefs(loadedPrefs)
        setSearches(loadedSearches)
      })
      .catch(e => { if (!cancelled) setError(messageOf(e, 'No pudimos cargar tus avisos. Intenta de nuevo.')) })
    return () => { cancelled = true }
  }, [user?.id])

  const toggle = async (type: NotificationType, value: boolean) => {
    if (!prefs) return
    const before = prefs
    setPrefs(withPref(prefs, type, value))
    setError(null)
    try {
      setPrefs(await notificationPrefsApi.update({ [type]: value }))
    } catch (e) {
      setPrefs(before)
      setError(messageOf(e, 'No pudimos guardar el cambio. Intenta de nuevo.'))
    }
  }

  const remove = async (search: SavedSearch) => {
    if (!window.confirm(`¿Borrar “${search.query}”? Dejarás de recibir avisos de esta búsqueda.`)) return
    setError(null)
    try {
      await savedSearchesApi.remove(search.id)
      setSearches(list => (list ?? []).filter(item => item.id !== search.id))
    } catch (e) {
      setError(messageOf(e, 'No pudimos borrar la búsqueda. Intenta de nuevo.'))
    }
  }

  const switches = (list: readonly NotificationTypeInfo[]) =>
    list.map((info, index) => (
      <Row key={info.type} last={index === list.length - 1}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: DISPLAY, color: '#0F1D2D' }}>{info.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.4, fontFamily: FONT, color: '#5D7EA0', marginTop: 2 }}>{info.description}</div>
        </div>
        <Toggle on={prefs?.[info.type] ?? false} label={info.title} disabled={!prefs} onChange={on => void toggle(info.type, on)} />
      </Row>
    ))

  let body: ReactNode
  if (!user) {
    body = (
      <section style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E8EDF2' }}>
        <p style={{ fontSize: 14, lineHeight: 1.55, fontFamily: FONT, color: '#0F1D2D', margin: '0 0 12px' }}>
          Inicia sesión para elegir qué avisos te llegan por correo y en la app.
        </p>
        <button
          onClick={onLogin}
          style={{ padding: '11px 18px', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, cursor: 'pointer', background: '#00B894', color: '#fff' }}
        >
          Iniciar sesión
        </button>
      </section>
    )
  } else if (!prefs && !error) {
    body = <p style={{ fontSize: 14, fontFamily: FONT, color: '#5D7EA0', textAlign: 'center' }}>Cargando…</p>
  } else {
    body = (
      <>
        {error && <p role="status" style={{ fontSize: 13, fontFamily: FONT, margin: '0 0 16px', color: '#D9363E' }}>{error}</p>}
        {prefs && (
          <>
            <Card title="Tus alertas" footer="Sobre lo que guardas o sigues. Te llegan por correo y, si activaste las notificaciones en la app, también en tu teléfono.">
              {switches(ALERT_TYPES)}
            </Card>
            <Card title="Promociones (opcional)" footer="Solo te llegan si las activas. Puedes apagarlas aquí o en la app cuando quieras.">
              {switches(PROMOTIONAL_TYPES)}
            </Card>
          </>
        )}
        {searches && (
          <Card
            title="Búsquedas guardadas"
            footer={searches.length ? 'Te avisamos cuando aparece algo nuevo o baja de tu precio máximo.' : 'Guarda una búsqueda desde la app (Buscar › Guardar búsqueda) y te avisamos cuando aparezca algo nuevo.'}
          >
            {searches.length === 0 ? (
              <Row last><span style={{ fontSize: 14, fontFamily: FONT, color: '#5D7EA0' }}>Aún no tienes búsquedas guardadas.</span></Row>
            ) : (
              searches.map((search, index) => (
                <Row key={search.id} last={index === searches.length - 1}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, fontFamily: DISPLAY, color: '#0F1D2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{search.query}</div>
                    <div style={{ fontSize: 13, fontFamily: FONT, color: '#5D7EA0', marginTop: 2 }}>{describeMaxPrice(search.maxPrice)}</div>
                  </div>
                  <button
                    onClick={() => void remove(search)}
                    aria-label={`Borrar búsqueda ${search.query}`}
                    style={{ width: 36, height: 36, borderRadius: 10, background: '#F2F4F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <XIcon size={16} color="#5D7EA0" />
                  </button>
                </Row>
              ))
            )}
          </Card>
        )}
      </>
    )
  }

  return (
    <div style={{ background: '#F2F4F7', minHeight: '100%', paddingBottom: 80 }}>
      <div style={{ background: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E8EDF2' }}>
        <button onClick={onBack} aria-label="Volver" style={{ width: 36, height: 36, borderRadius: 10, background: '#F2F4F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={18} color="#0F1D2D" />
        </button>
        <BellIcon size={18} color="#00B894" />
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: DISPLAY, color: '#0F1D2D' }}>Notificaciones</span>
      </div>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 0' }}>{body}</div>
    </div>
  )
}
