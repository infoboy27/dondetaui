import type { CSSProperties } from 'react'
import { track } from '../analytics'
import { appConfig } from '../config/env'
import { AMAZON_DISCLOSURE, amazonConfig, amazonSearchUrl } from '../domain/amazon'
import type { Product } from '../types'

// "¿Y en Amazon?": an Amazon Associates search link for the same product, for
// shoppers who import by courier. Renders nothing until VITE_AMAZON_TAG is set,
// and never for gaming (Eneba). Same copy as the web-seo product page.
export default function AmazonCard({ product, style }: { product: Product; style?: CSSProperties }) {
  const url = amazonSearchUrl(product, amazonConfig(appConfig.amazonTag, appConfig.amazonDomain))
  if (!url) return null
  return (
    <div style={{
      ...style,
      background: '#fff', borderRadius: 16, border: '1px solid #E8EDF2',
      boxShadow: '0 2px 8px rgba(15,29,45,0.04)', padding: '14px 16px',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#0F1D2D', marginBottom: 4 }}>
        ¿Y en Amazon?
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif" }}>
        Si lo traes por courier, compara el total: precio en Amazon + envío por libra + impuestos si pasa de US$200.{' '}
        <a href="/guias/comprar-en-amazon-desde-rd" style={{ color: '#00B894' }}>Cómo calcularlo</a>
      </p>
      <a
        href={url}
        target="_blank"
        rel="nofollow sponsored noopener"
        onClick={() => track('click_amazon', { item_id: product.id })}
        style={{ fontSize: 14, fontWeight: 700, color: '#00B894', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" }}
      >
        Buscar en Amazon ↗
      </a>
      <div style={{ marginTop: 8, fontSize: 11, color: '#9AAABB', fontFamily: "'DM Sans', sans-serif" }}>
        {AMAZON_DISCLOSURE} Comprar por este enlace no te cuesta más.
      </div>
    </div>
  )
}
