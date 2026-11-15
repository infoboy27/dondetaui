'use client'

import { useEffect, useState } from 'react'
import { whatsappShareHref } from '../lib/share'
import { colors, fonts } from '../lib/tokens'

interface Props {
  productId: string
  message: string
  /** Product URL tagged utm_source=whatsapp (the wa.me button). */
  whatsappUrl: string
  /** Product URL tagged utm_source=web_share (the system share sheet). */
  shareSheetUrl: string
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// GA4's recommended "share" event, same as the SPA (src/analytics.ts).
function trackShare(method: 'whatsapp' | 'web_share', productId: string) {
  window.gtag?.('event', 'share', { method, content_type: 'product', item_id: productId })
}

export default function ShareButtons({ productId, message, whatsappUrl, shareSheetUrl }: Props) {
  // navigator.share only exists in the browser (and not on most desktops):
  // decided after hydration so server and client render the same markup.
  const [canShare, setCanShare] = useState(false)
  useEffect(() => { setCanShare(typeof navigator.share === 'function') }, [])

  const button = {
    display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 16px', borderRadius: 10,
    fontFamily: fonts.display, fontWeight: 700, fontSize: 14, textDecoration: 'none', cursor: 'pointer',
  } as const

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      <a
        href={whatsappShareHref(message, whatsappUrl)}
        target="_blank"
        rel="noopener"
        onClick={() => trackShare('whatsapp', productId)}
        style={{ ...button, background: '#25D366', color: colors.navy }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill={colors.navy}
            d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"
          />
        </svg>
        Compartir por WhatsApp
      </a>
      {canShare && (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.share({ text: message, url: shareSheetUrl })
              trackShare('web_share', productId)
            } catch {
              /* cancelled */
            }
          }}
          style={{ ...button, background: colors.card, color: colors.navy, border: `1px solid ${colors.border}` }}
        >
          Compartir
        </button>
      )}
    </div>
  )
}
