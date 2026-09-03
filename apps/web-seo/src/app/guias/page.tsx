import type { Metadata } from 'next'
import { BUYING_GUIDES, guideReadingMinutes } from '../../lib/content'
import { H1, Lead, Shell } from '../../lib/page'
import { colors, fonts } from '../../lib/tokens'

export const metadata: Metadata = {
  title: 'Guías de compra — DóndeTa',
  description:
    'Guías prácticas para comparar electrodomésticos, aires acondicionados, neveras, lavadoras, estufas y televisores antes de comprar en República Dominicana.',
  alternates: { canonical: '/guias' },
}

export default function GuidesIndexPage() {
  return (
    <Shell>
      <H1>Guías de compra</H1>
      <Lead>
        Antes de comparar precios conviene saber qué comparar. Estas guías explican los criterios que realmente importan
        en cada categoría —capacidad, consumo, instalación, garantía— para hogares dominicanos.
      </Lead>

      <div style={{ display: 'grid', gap: 14 }}>
        {BUYING_GUIDES.map(guide => (
          <a
            key={guide.slug}
            href={`/guias/${guide.slug}`}
            style={{
              display: 'block',
              padding: 22,
              borderRadius: 16,
              background: colors.card,
              border: `1px solid ${colors.border}`,
              textDecoration: 'none',
            }}
          >
            <strong style={{ display: 'block', fontFamily: fonts.display, fontSize: 19, color: colors.navy }}>
              {guide.title}
            </strong>
            <span style={{ display: 'block', marginTop: 8, fontFamily: fonts.body, fontSize: 14, lineHeight: 1.6, color: colors.navy400 }}>
              {guide.description}
            </span>
            <span style={{ display: 'block', marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: colors.navy200 }}>
              {guideReadingMinutes(guide)} min de lectura · actualizada el {guide.updated}
            </span>
          </a>
        ))}
      </div>
    </Shell>
  )
}
