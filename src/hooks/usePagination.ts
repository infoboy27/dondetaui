import { useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

interface Pagination<T> {
  page: number
  pageSize: PageSize
  totalPages: number
  total: number
  pageItems: T[]
  setPage: (page: number) => void
  setPageSize: (size: PageSize) => void
}

// Client-side pagination over an already-filtered/sorted array. Resets to
// page 1 whenever the source array identity changes (new search, new
// filters) so the user never lands on a now-empty trailing page.
export function usePagination<T>(items: T[], initialPageSize: PageSize = 20): Pagination<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize)

  useEffect(() => {
    setPage(1)
  }, [items])

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pageItems = useMemo(() => {
    const clampedPage = Math.min(page, totalPages)
    const start = (clampedPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize, totalPages])

  return {
    page: Math.min(page, totalPages),
    pageSize,
    totalPages,
    total,
    pageItems,
    setPage,
    setPageSize: (size: PageSize) => {
      setPageSize(size)
      setPage(1)
    },
  }
}
