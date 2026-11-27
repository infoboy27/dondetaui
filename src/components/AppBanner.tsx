import { useState } from 'react'
import { APP_BANNER_DISMISSED_KEY, mobilePlatform, shouldShowAppBanner, storeUrl } from '../domain/appStores'
import { DondeTaMark } from './Icons'

function readDismissedAt(): string | null {
  try {
    return localStorage.getItem(APP_BANNER_DISMISSED_KEY)
  } catch {
    return null
  }
}

// "Get the app" card for phones, linking to the store that fits the phone.
// Plain iOS Safari gets Apple's Smart App Banner instead (index.html).
export default function AppBanner() {
  const userAgent = navigator.userAgent
  const [visible, setVisible] = useState(() => shouldShowAppBanner(userAgent, readDismissedAt()))
  const platform = mobilePlatform(userAgent)
  if (!visible || !platform) return null

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(APP_BANNER_DISMISSED_KEY, new Date().toISOString())
    } catch {
      /* private mode: the banner just reappears next visit */
    }
  }

  return (
    <div
      role="region"
      aria-label="Descargar el app"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, margin: '14px 20px 0', padding: '12px 14px',
        background: '#fff', border: '1px solid #E8EDF2', borderRadius: 16,
      }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 10, background: '#E6F7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <DondeTaMark size={26} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 700, color: '#0F1D2D' }}>
          DóndeTa ya está en {platform === 'ios' ? 'iPhone' : 'Android'}
        </span>
        <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#5d7ea0', marginTop: 1 }}>
          Alertas de precio y escáner · Gratis
        </span>
      </span>
      <a
        href={storeUrl(platform)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: '#00B894', color: '#fff', borderRadius: 999, padding: '7px 14px', flexShrink: 0,
          fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}
      >
        Descargar
      </a>
      <button type="button" onClick={dismiss} aria-label="Cerrar" style={{ background: 'none', border: 0, fontSize: 15, color: '#9AAABB', cursor: 'pointer', padding: 2 }}>
        ✕
      </button>
    </div>
  )
}
