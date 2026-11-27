import { APP_STORE_URL, PLAY_STORE_URL } from '../domain/appStores'
import { AndroidIcon, AppleIcon } from './Icons'

// "Download on the App Store / Get it on Google Play" links.
export default function AppStoreButtons({ stretch = false }: { stretch?: boolean }) {
  const stores = [
    { href: APP_STORE_URL, icon: <AppleIcon size={20} color="#fff" />, kicker: 'Descárgala en', name: 'App Store', label: 'Descargar DóndeTa en el App Store' },
    { href: PLAY_STORE_URL, icon: <AndroidIcon size={20} />, kicker: 'Disponible en', name: 'Google Play', label: 'Descargar DóndeTa en Google Play' },
  ]
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {stores.map(store => (
        <a
          key={store.name}
          href={store.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={store.label}
          style={{
            flex: stretch ? 1 : undefined, display: 'flex', alignItems: 'center', gap: 9,
            background: '#0F1D2D', borderRadius: 12, padding: '8px 14px', textDecoration: 'none', minWidth: 140,
          }}
        >
          {store.icon}
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: "'DM Sans', sans-serif" }}>{store.kicker}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: "'Poppins', sans-serif" }}>{store.name}</span>
          </span>
        </a>
      ))}
    </div>
  )
}
