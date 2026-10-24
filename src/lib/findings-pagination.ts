export const FINDINGS_PAGE_SIZE = 20

export function paginateFindings<T>(
  items: readonly T[],
  requestedPage: number
) {
  const pageCount = Math.max(1, Math.ceil(items.length / FINDINGS_PAGE_SIZE))
  const page = Math.min(Math.max(1, Math.floor(requestedPage)), pageCount)
  const startIndex = (page - 1) * FINDINGS_PAGE_SIZE
  return {
    items: items.slice(startIndex, startIndex + FINDINGS_PAGE_SIZE),
    page,
    pageCount,
    start: items.length ? startIndex + 1 : 0,
    end: Math.min(startIndex + FINDINGS_PAGE_SIZE, items.length),
    total: items.length,
  }
}
