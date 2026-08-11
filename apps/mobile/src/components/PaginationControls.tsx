import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../design/tokens'
import { fonts } from '../design/fonts'
import { PAGE_SIZE_OPTIONS, type PageSize } from '../hooks/usePagination'

interface Props {
  page: number
  totalPages: number
  pageSize: PageSize
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
}

function pageNumbers(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)

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
    <View style={styles.wrap}>
      <Text style={styles.summary}>
        Mostrando <Text style={styles.bold}>{start}–{end}</Text> de <Text style={styles.bold}>{total}</Text>
      </Text>

      <View style={styles.pageSizeRow}>
        <Text style={styles.pageSizeLabel}>Por página</Text>
        <View style={styles.pageSizeGroup}>
          {PAGE_SIZE_OPTIONS.map(size => (
            <Pressable
              key={size}
              onPress={() => onPageSizeChange(size)}
              style={[styles.pageSizeBtn, pageSize === size && styles.pageSizeBtnActive]}
            >
              <Text style={[styles.pageSizeBtnText, pageSize === size && styles.pageSizeBtnTextActive]}>{size}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {totalPages > 1 && (
        <View style={styles.pager}>
          <Pressable onPress={() => onPageChange(page - 1)} disabled={page <= 1} style={[styles.pagerBtn, page <= 1 && styles.pagerBtnDisabled]}>
            <Text style={styles.pagerBtnText}>‹</Text>
          </Pressable>

          {pageNumbers(page, totalPages).map((p, i) =>
            p === 'ellipsis' ? (
              <Text key={`e${i}`} style={styles.ellipsis}>…</Text>
            ) : (
              <Pressable key={p} onPress={() => onPageChange(p)} style={[styles.pagerBtn, p === page && styles.pagerBtnActive]}>
                <Text style={[styles.pagerBtnText, p === page && styles.pagerBtnTextActive]}>{p}</Text>
              </Pressable>
            ),
          )}

          <Pressable onPress={() => onPageChange(page + 1)} disabled={page >= totalPages} style={[styles.pagerBtn, page >= totalPages && styles.pagerBtnDisabled]}>
            <Text style={styles.pagerBtnText}>›</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingVertical: spacing.lg },
  summary: { fontSize: 12, color: colors.navy400, fontFamily: fonts.body.regular },
  bold: { color: colors.navy, fontFamily: fonts.body.bold },
  pageSizeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pageSizeLabel: { fontSize: 12, color: colors.navy400, fontFamily: fonts.body.regular },
  pageSizeGroup: { flexDirection: 'row', gap: 4, backgroundColor: colors.background, borderRadius: radii.md, padding: 3 },
  pageSizeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.sm },
  pageSizeBtnActive: { backgroundColor: colors.card },
  pageSizeBtnText: { fontSize: 12, fontFamily: fonts.body.bold, color: colors.navy400 },
  pageSizeBtnTextActive: { color: colors.primary },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  pagerBtn: { minWidth: 32, height: 32, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  pagerBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pagerBtnDisabled: { opacity: 0.4 },
  pagerBtnText: { fontSize: 13, fontFamily: fonts.body.bold, color: colors.navy },
  pagerBtnTextActive: { color: colors.primary },
  ellipsis: { paddingHorizontal: 4, color: colors.navy200, fontSize: 12 },
})
