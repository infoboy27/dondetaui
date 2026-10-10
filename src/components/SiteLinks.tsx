// Links to the publisher pages served by apps/web-seo (plain <a>, full page
// loads -- they are not SPA routes). AdSense requires the privacy policy and
// site info to be reachable from the home page; this keeps that a single
// quiet line inside the existing footer instead of a separate landing page.
const LINKS = [
  { href: '/guias', label: 'Guías' },
  { href: '/metodologia', label: 'Metodología' },
  { href: '/sobre-dondeta', label: 'Sobre DóndeTa' },
  { href: '/privacy', label: 'Privacidad' },
  { href: '/terminos', label: 'Términos' },
  { href: '/contacto', label: 'Contacto' },
]

export const DONATE_URL = 'https://www.paypal.com/donate/?hosted_button_id=V7TJW93WQCTE8'

export function SiteLinks({ align = 'left' }: { align?: 'left' | 'center' }) {
  return (
    <nav
      aria-label="Información del sitio"
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '4px 14px',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {LINKS.map(link => (
        <a
          key={link.href}
          href={link.href}
          style={{ fontSize: 12, color: '#5d7ea0', fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}
        >
          {link.label}
        </a>
      ))}
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12, color: '#00B894', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}
      >
        💚 Apóyanos con una donación
      </a>
    </nav>
  )
}
