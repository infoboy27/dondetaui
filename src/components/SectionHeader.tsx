import { CATEGORIES } from '../data/mock'
import { colors, fonts, radii } from '../design/tokens'
import { GAMING_CATEGORY } from '../domain/gaming'
import { SECTION_SUBTITLES, sectionFilters } from '../domain/sections'
import type { Product } from '../types'
import DiscountCode from './DiscountCode'
import EnebaBadge from './EnebaBadge'

interface Props {
  category: string
  // Every product in the section, before the quick filter.
  products: Product[]
  selected: string | null
  onSelect: (id: string | null) => void
}

// Top of a category page: what the section is, how big it is, and one-tap
// sub-sections -- so "Gaming" or "Electrodomésticos" opens like a place,
// not like a bare search result.
export default function SectionHeader({ category, products, selected, onSelect }: Props) {
  const meta = CATEGORIES.find(c => c.id === category)
  const filters = sectionFilters(category, products)
  const stores = new Set(products.flatMap(p => p.prices.map(offer => offer.store))).size
  const subtitle = SECTION_SUBTITLES[category]
    ?? `${products.length.toLocaleString('es-DO')} productos comparados en ${stores} ${stores === 1 ? 'tienda' : 'tiendas'}`

  return (
    <div style={{
      background: meta?.color ?? colors.card,
      border: `1.5px solid ${meta?.border ?? colors.border}33`,
      borderRadius: radii.lg, padding: '16px 16px 12px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span aria-hidden="true" style={{
          fontSize: 28, width: 52, height: 52, borderRadius: radii.md, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {meta?.emoji}
        </span>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: fonts.display, color: colors.navy, letterSpacing: '-0.02em' }}>
            {meta?.label ?? category}
          </h1>
          <div style={{ fontSize: 12, color: colors.navy400, fontFamily: fonts.body, marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
      </div>

      {category === GAMING_CATEGORY && (
        <>
          <div><EnebaBadge /></div>
          <DiscountCode compact />
        </>
      )}

      {filters.length > 1 && (
        <div role="group" aria-label="Filtrar sección" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {[{ id: null, label: 'Todo', count: products.length }, ...filters].map(filter => {
            const active = selected === filter.id
            return (
              <button
                type="button"
                key={filter.id ?? 'all'}
                onClick={() => onSelect(filter.id)}
                aria-pressed={active}
                style={{
                  flexShrink: 0, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: active ? colors.navy : '#fff',
                  color: active ? '#fff' : colors.navy,
                  border: `1px solid ${active ? colors.navy : colors.border}`,
                  borderRadius: radii.full, padding: '6px 12px',
                  fontSize: 12, fontWeight: 600, fontFamily: fonts.body,
                }}
              >
                {filter.label} <span style={{ opacity: 0.6, fontWeight: 500 }}>{filter.count}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
