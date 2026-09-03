import { useEffect, useRef } from 'react'
import { appConfig } from '../config/env'
import type { AdSize } from '../data/adSizes'

type Props = AdSize & { className?: string; slot?: string }

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

let scriptLoad: Promise<void> | null = null

// Loads the AdSense loader script once per page, however many AdBanner
// instances mount -- a second <script src="...adsbygoogle.js?client=..."> tag
// would just refetch the same script for no benefit.
function loadAdSenseScript(clientId: string): Promise<void> {
  scriptLoad ??= new Promise(resolve => {
    // index.html carries its own static adsbygoogle.js tag (for AdSense
    // site verification, present regardless of ad-slot config) -- match by
    // src, not just our own data-attribute, so we don't fetch it twice.
    if (document.querySelector('script[data-adsbygoogle], script[src*="adsbygoogle.js"]')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.dataset.adsbygoogle = 'true'
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })
  return scriptLoad
}

// Renders a real AdSense unit only after the site is approved and both
// VITE_ADSENSE_CLIENT_ID and the placement slot id are configured. During
// review, render nothing so app screens cannot look like ad placeholders.
export default function AdBanner({ width, className, slot }: Props) {
  const pushedRef = useRef(false)
  const clientId = appConfig.adsenseClientId
  const isLive = Boolean(clientId && slot)

  useEffect(() => {
    if (!isLive || !clientId || pushedRef.current) return
    pushedRef.current = true
    loadAdSenseScript(clientId).then(() => {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        // Ad blockers / failed loads shouldn't break the page.
      }
    })
  }, [isLive, clientId])

  if (isLive) {
    return (
      <ins
        className={`adsbygoogle${className ? ` ${className}` : ''}`}
        style={{ display: 'block', width: '100%', maxWidth: width }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    )
  }

  return null
}
