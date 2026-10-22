import { useState } from 'react'
import { countryForHost, countryForLanguage } from '../domain/countries'

const DISMISSED_KEY = 'dondeta.countryBannerDismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

// Suggests the visitor's country site when the browser language points to
// another one ("es-MX" on the DR site). A link, never a redirect.
export default function CountryBanner() {
  const [dismissed, setDismissed] = useState(readDismissed)
  const current = countryForHost(window.location.hostname)
  const suggested = countryForLanguage(navigator.language)
  if (dismissed || !suggested || suggested.code === current.code) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      /* private mode: the banner just reappears next visit */
    }
  }

  return (
    <div
      role="region"
      aria-label="Cambiar de país"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, margin: '14px 20px 0', padding: '10px 14px',
        background: '#E6F7F3', borderRadius: 14, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#0F1D2D',
      }}
    >
      <span aria-hidden style={{ fontSize: 20 }}>{suggested.flag}</span>
      <span style={{ flex: 1 }}>
        ¿Compras en {suggested.name}?{' '}
        <a href={suggested.url} style={{ color: '#007A63', fontWeight: 700 }}>
          Ver tiendas {suggested.storesAdjective}
        </a>
      </span>
      <button type="button" onClick={dismiss} aria-label="Cerrar" style={{ background: 'none', border: 0, fontSize: 16, color: '#5d7ea0', cursor: 'pointer' }}>
        ✕
      </button>
    </div>
  )
}
