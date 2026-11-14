'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AUTH_TOKEN_KEY, PROMPT_DELAY_MS, PROMPT_DISMISSED_KEY, PROMPT_DONE_KEY, PROMPT_SCROLL_RATIO, SIGNUP_SOURCE_KEY,
  buildSignupSource, readStorage, shouldShowSignupPrompt, signupPromptCopy, writeStorage, type PromptCopy,
} from '../lib/signupPrompt'

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

const track = (event: string, params: Record<string, unknown>) => window.gtag?.('event', event, params)

// Mirror of src/components/SignupPrompt.tsx for the server-rendered pages.
// Not an interstitial: bottom sheet on mobile, corner card on desktop.
// "Signed in" = the SPA's token in localStorage (same origin).
export default function SignupPrompt({ blackFridayDigest }: { blackFridayDigest: boolean }) {
  const [copy, setCopy] = useState<PromptCopy | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // First-touch attribution for the sign-up alert (most visits land here).
    if (readStorage(SIGNUP_SOURCE_KEY) === null) writeStorage(SIGNUP_SOURCE_KEY, buildSignupSource(window.location.href, document.referrer))

    const eligible = shouldShowSignupPrompt({
      pathname: window.location.pathname,
      search: window.location.search,
      signedIn: readStorage(AUTH_TOKEN_KEY) !== null,
      dismissedAt: readStorage(PROMPT_DISMISSED_KEY),
      done: readStorage(PROMPT_DONE_KEY) !== null,
    })
    if (!eligible) return
    const next = signupPromptCopy(new Date(), blackFridayDigest)
    let shown = false
    const show = () => {
      if (shown) return
      shown = true
      setCopy(next)
      track('signup_prompt_view', { prompt: next.kind })
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
  }, [blackFridayDigest])

  useEffect(() => {
    if (!copy) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy])

  if (!copy) return null

  function dismiss() {
    writeStorage(PROMPT_DISMISSED_KEY, new Date().toISOString())
    if (copy) track('signup_prompt_dismiss', { prompt: copy.kind })
    setCopy(null)
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
        .signup-prompt { left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); }
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
