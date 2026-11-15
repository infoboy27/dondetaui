import type { CSSProperties } from 'react'
import { trackShare } from '../analytics'
import { productShareUrl, whatsappShareHref } from '../domain/share'

interface Props {
  productId: string
  slug: string
  siteUrl: string
  message: string
  style?: CSSProperties
}

// The WhatsApp logo, drawn in the button's text color.
function WhatsAppGlyph({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={color}
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"
      />
    </svg>
  )
}

// "Compartir por WhatsApp": opens WhatsApp (app or web) with the message and
// the product link ready to send. The link's preview is the product's share
// card (apps/web-seo share-image).
export default function WhatsAppShareButton({ productId, slug, siteUrl, message, style }: Props) {
  const href = whatsappShareHref(message, productShareUrl(siteUrl, slug, 'whatsapp'))
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={() => trackShare(productId, 'whatsapp')}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        minHeight: 44, borderRadius: 12, background: '#25D366', color: '#0F1D2D',
        fontSize: 14, fontWeight: 700, fontFamily: "'Poppins', sans-serif", textDecoration: 'none',
        ...style,
      }}
    >
      <WhatsAppGlyph color="#0F1D2D" />
      Compartir por WhatsApp
    </a>
  )
}
