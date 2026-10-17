import { blackFridayBanner } from '../domain/blackFriday'

// Links to the /black-friday price check (served by web-seo behind the same domain).
export default function BlackFridayBanner() {
  const banner = blackFridayBanner()
  if (!banner) return null

  return (
    <a
      href="/black-friday"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, margin: '14px 20px 0', padding: '14px 16px',
        background: '#0F1D2D', borderRadius: 16, textDecoration: 'none',
      }}
    >
      <span aria-hidden style={{ fontSize: 26 }}>🏷️</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 700, color: '#FFD166' }}>
          {banner.title}
        </span>
        <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
          {banner.subtitle}
        </span>
      </span>
      <span aria-hidden style={{ color: '#FFD166', fontSize: 18 }}>›</span>
    </a>
  )
}
