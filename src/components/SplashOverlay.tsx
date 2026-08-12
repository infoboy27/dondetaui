import { useEffect, useState } from 'react'
import { DondeTaMark } from './Icons'

const SESSION_KEY = 'dondeta_splash_shown'

// Brief, once-per-browser-session welcome moment. Gated by sessionStorage
// (not localStorage) so it reappears on a fresh tab/visit, not just once
// ever. Never blocks interactivity -- the real app underneath mounts and
// fetches immediately; this is a pure CSS overlay that removes itself.
export default function SplashOverlay() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY)
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!visible) return
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // Private browsing / storage unavailable -- it'll just show again
      // next mount, which is a harmless fallback, not an error.
    }
    const timer = setTimeout(() => setVisible(false), 1300)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <div className="splash-overlay" aria-hidden="true">
      <div className="splash-mark">
        <DondeTaMark size={72} />
      </div>
      <span
        className="splash-word"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: '#fff',
          letterSpacing: '-0.02em',
        }}
      >
        DóndeTa
      </span>
    </div>
  )
}
