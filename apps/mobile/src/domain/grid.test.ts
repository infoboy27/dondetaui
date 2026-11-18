import { describe, expect, it } from 'vitest'
import { withAdSlots } from './feed'
import { columnsForWidth, gridRows, isWide } from './grid'

const shape = (rows: ReturnType<typeof gridRows<number>>) =>
  rows.map(row => (row.kind === 'ad' ? 'A' : row.items.join(','))).join(' ')

describe('columnsForWidth', () => {
  it('keeps one column on every phone width', () => {
    expect(columnsForWidth(320)).toBe(1)
    expect(columnsForWidth(440)).toBe(1)
    expect(columnsForWidth(639)).toBe(1)
  })
  it('uses two columns on mid widths and three on large ones', () => {
    expect(columnsForWidth(640)).toBe(2)
    expect(columnsForWidth(999)).toBe(2)
    expect(columnsForWidth(1000)).toBe(3)
    expect(columnsForWidth(1366)).toBe(3)
  })
  it('splits the product page only when both halves fit a store row', () => {
    expect(isWide(759)).toBe(false)
    expect(isWide(760)).toBe(true)
  })
})

describe('gridRows', () => {
  const feed = (n: number, opts?: { firstAt?: number; every?: number }) => withAdSlots(Array.from({ length: n }, (_, i) => i), opts)

  it('one column is one item per row, ads in place', () => {
    expect(shape(gridRows(feed(5, { firstAt: 2, every: 10 }), 1, String))).toBe('0 1 A 2 3 4')
  })
  it('groups items into rows and leaves a short last row', () => {
    expect(shape(gridRows(feed(5, { firstAt: 99 }), 2, String))).toBe('0,1 2,3 4')
    expect(shape(gridRows(feed(7, { firstAt: 99 }), 3, String))).toBe('0,1,2 3,4,5 6')
  })
  it('an ad flushes the row in progress and takes a full row', () => {
    expect(shape(gridRows(feed(6, { firstAt: 3, every: 10 }), 2, String))).toBe('0,1 2 A 3,4 5')
  })
  it('keys are stable and unique', () => {
    const rows = gridRows(feed(30), 3, String)
    const keys = rows.map(row => row.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('treats bad column counts as one', () => {
    expect(shape(gridRows(feed(2, { firstAt: 99 }), 0, String))).toBe('0 1')
  })
})
