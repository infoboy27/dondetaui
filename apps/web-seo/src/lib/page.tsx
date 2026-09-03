import type { ReactNode } from 'react'
import { MAIN_NAV } from './content'
import { SITE_URL } from './site'
import { colors, fonts } from './tokens'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px 72px' }}>
      <header style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 34 }}>
        <a href={SITE_URL} style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 22, color: colors.navy, textDecoration: 'none' }}>
          DóndeTa
        </a>
        <nav style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {MAIN_NAV.map(item => (
            <a key={item.href} href={item.href} style={{ fontFamily: fonts.body, fontSize: 13, color: colors.navy400, textDecoration: 'none', fontWeight: 700 }}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      {children}
      <footer style={{ marginTop: 56, paddingTop: 24, borderTop: `1px solid ${colors.border}`, fontFamily: fonts.body, fontSize: 13, color: colors.navy400 }}>
        <p>Datos de precios recopilados regularmente desde tiendas publicas. Verifica precio final y disponibilidad antes de comprar.</p>
        <p>
          <a href="/privacy" style={{ color: colors.primary }}>Privacidad</a>
          {' · '}
          <a href="/terminos" style={{ color: colors.primary }}>Terminos</a>
          {' · '}
          <a href="/contacto" style={{ color: colors.primary }}>Contacto</a>
        </p>
      </footer>
    </main>
  )
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 style={{ fontFamily: fonts.display, fontSize: 38, lineHeight: 1.08, color: colors.navy, margin: '0 0 14px' }}>{children}</h1>
}

export function Lead({ children }: { children: ReactNode }) {
  return <p style={{ fontFamily: fonts.body, fontSize: 18, lineHeight: 1.65, color: colors.navy400, margin: '0 0 26px' }}>{children}</p>
}

export function Card({ children }: { children: ReactNode }) {
  return <section style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 22, marginBottom: 16 }}>{children}</section>
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 style={{ fontFamily: fonts.display, fontSize: 22, color: colors.navy, margin: '0 0 10px' }}>{children}</h2>
}

export function P({ children }: { children: ReactNode }) {
  return <p style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 1.75, color: colors.navy400, margin: '0 0 12px' }}>{children}</p>
}
