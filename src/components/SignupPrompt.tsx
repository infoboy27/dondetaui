import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { track } from '../analytics'
import { CURRENCY_SYMBOL } from '../domain/currency'
import {
  PROMPT_DELAY_MS, PROMPT_DISMISSED_KEY, PROMPT_DONE_KEY, PROMPT_SCROLL_RATIO,
  readStorage, shouldShowSignupPrompt, signupPromptCopy, writeStorage,
} from '../domain/signupPrompt'

// First-visit sign-up card. Deliberately not an interstitial: a bottom sheet
// on mobile (Google penalizes full-screen popups for search visitors) and a
// small corner card on desktop. Shows after 10 s or half a page of scrolling.
// Mirror of apps/web-seo/src/app/SignupPrompt.tsx for the SEO pages.
export default function SignupPrompt({ signedIn }: { signedIn: boolean }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  // The Black Friday digest is Dominican-only; other stacks get the generic pitch.
  const copy = signupPromptCopy(new Date(), CURRENCY_SYMBOL === 'RD$')

  const eligible = shouldShowSignupPrompt({
    pathname: location.pathname,
    search: location.search,
    signedIn,
    dismissedAt: readStorage(PROMPT_DISMISSED_KEY),
    done: readStorage(PROMPT_DONE_KEY) !== null,
  })

  useEffect(() => {
    if (!eligible) {
      setOpen(false)
      return
    }
    let shown = false
    const show = () => {
      if (shown) return
      shown = true
      setOpen(true)
      track('signup_prompt_view', { prompt: copy.kind })
    }
    const timer = window.setTimeout(show, PROMPT_DELAY_MS)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0 && window.scrollY / max >= PROMPT_SCROLL_RATIO) show()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [eligible, copy.kind])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open || !eligible) return null

  function dismiss() {
    writeStorage(PROMPT_DISMISSED_KEY, new Date().toISOString())
    setOpen(false)
    track('signup_prompt_dismiss', { prompt: copy.kind })
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="signup-prompt-title"
      className="signup-prompt"
      style={{
        position: 'fixed', zIndex: 60, background: '#0F1D2D', color: '#fff',
        borderRadius: 20, padding: '18px 18px 16px', boxShadow: '0 12px 40px rgba(15,29,45,0.35)',
        fontFamily: "'DM Sans', sans-serif", maxHeight: '40vh', overflow: 'auto',
      }}
    >
      <style>{`
        .signup-prompt { left: 12px; right: 12px; bottom: calc(76px + env(safe-area-inset-bottom)); }
        @media (min-width: 1024px) { .signup-prompt { left: auto; right: 24px; bottom: 24px; width: 360px; } }
      `}</style>
      <button
        ref={closeRef}
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        style={{
          position: 'absolute', top: 8, right: 8, width: 36, height: 36, borderRadius: 18,
          border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, cursor: 'pointer',
        }}
      >
        ×
      </button>
      <div id="signup-prompt-title" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1.3, color: '#FFD166', paddingRight: 36 }}>
        {copy.title}
      </div>
      <p style={{ margin: '6px 0 14px', fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>{copy.body}</p>
      <a
        href={copy.href}
        onClick={() => track('signup_prompt_click', { prompt: copy.kind })}
        style={{
          display: 'block', textAlign: 'center', background: '#00B894', color: '#0F1D2D', textDecoration: 'none',
          fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, padding: '12px 16px', borderRadius: 999,
        }}
      >
        {copy.cta}
      </a>
    </div>
  )
}
