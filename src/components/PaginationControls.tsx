import { colors, fonts, radii, spacing } from '../design/tokens'
import { PAGE_SIZE_OPTIONS, type PageSize } from '../hooks/usePagination'
import { ChevronLeft, ChevronRight } from './Icons'

interface Props {
  page: number
  totalPages: number
  pageSize: PageSize
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
}

function pageNumbers(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = new Set([1, totalPages, page, page - 1, page + 1])
  const sorted = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

export default function PaginationControls({ page, totalPages, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
      gap: spacing.md, padding: `${spacing.lg}px 0`,
    }}>
      <span style={{ fontSize: 13, color: colors.navy400, fontFamily: fonts.body }}>
        Mostrando <strong style={{ color: colors.navy }}>{start}–{end}</strong> de <strong style={{ color: colors.navy }}>{total}</strong>
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: 12, color: colors.navy400, fontFamily: fonts.body }}>Por página</span>
          <div style={{ display: 'flex', gap: 4, background: colors.background, borderRadius: radii.md, padding: 3 }}>
            {PAGE_SIZE_OPTIONS.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => onPageSizeChange(size)}
                aria-pressed={pageSize === size}
                style={{
                  border: 'none', cursor: 'pointer',
                  borderRadius: radii.sm, padding: '5px 10px',
                  fontSize: 12, fontWeight: 600, fontFamily: fonts.body,
                  background: pageSize === size ? colors.card : 'transparent',
                  color: pageSize === size ? colors.primary : colors.navy400,
                  boxShadow: pageSize === size ? '0 1px 2px rgba(15,29,45,0.08)' : 'none',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <nav aria-label="Paginación" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Página anterior"
              style={pagerBtnStyle(false, page <= 1)}
            >
              <ChevronLeft size={14} color={page <= 1 ? colors.navy200 : colors.navy} />
            </button>

            {pageNumbers(page, totalPages).map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e${i}`} style={{ padding: '0 4px', color: colors.navy200, fontSize: 12 }}>…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                  style={pagerBtnStyle(p === page, false)}
                >
                  {p}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Página siguiente"
              style={pagerBtnStyle(false, page >= totalPages)}
            >
              <ChevronRight size={14} color={page >= totalPages ? colors.navy200 : colors.navy} />
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}

function pagerBtnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    minWidth: 30, height: 30, borderRadius: radii.sm,
    border: `1px solid ${active ? colors.primary : colors.border}`,
    background: active ? colors.primaryLight : colors.card,
    color: active ? colors.primary : colors.navy,
    fontSize: 12, fontWeight: 600, fontFamily: fonts.body,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
