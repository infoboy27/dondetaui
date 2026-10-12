import { useState } from 'react'
import { colors } from '../design/tokens'
import { PackageIcon } from './Icons'

interface Props {
  src: string
  alt: string
  // The likely LCP image (first card above the fold): fetch it first instead
  // of lazily. Everything else waits until it's near the viewport.
  priority?: boolean
}

// Centralizes the "missing/broken product photo" fallback so every product
// card shows a neutral placeholder instead of the browser's broken-image
// icon or an empty box — src can be '' (never scraped) or a URL that 404s
// later (dead retailer/CDN link), both land here.
export default function ProductImage({ src, alt, priority = false }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: colors.navy50,
      }}>
        <PackageIcon size={28} color={colors.navy200} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  )
}
