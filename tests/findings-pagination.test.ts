import { expect, test } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { FindingsTable } from "../src/components/findings-table"
import { normalizeDataset } from "../src/lib/findings"
import { paginateFindings } from "../src/lib/findings-pagination"

test("pagination clamps to the last page when results shrink", () => {
  const items = Array.from({ length: 45 }, (_, index) => index + 1)
  expect(paginateFindings(items, 2).items).toEqual(items.slice(20, 40))

  const reduced = paginateFindings(items.slice(0, 22), 3)
  expect(reduced.page).toBe(2)
  expect(reduced.items).toEqual([21, 22])
  expect([reduced.start, reduced.end, reduced.total]).toEqual([21, 22, 22])
})

test("next and previous page windows stay within the filtered results", () => {
  const items = Array.from({ length: 45 }, (_, index) => index + 1)
  const first = paginateFindings(items, 1)
  const next = paginateFindings(items, first.page + 1)
  const previous = paginateFindings(items, next.page - 1)

  expect([next.page, next.start, next.end]).toEqual([2, 21, 40])
  expect(next.items).toEqual(items.slice(20, 40))
  expect(previous.items).toEqual(first.items)
})

test("findings page shows 20 rows after filtering and sorting", () => {
  const findings = normalizeDataset(
    Array.from({ length: 28 }, (_, index) => {
      const number = index + 1
      return {
        id: `finding-${number}`,
        title: `Finding ${number}`,
        severity: [2, 5, 8, 11, 14].includes(number) ? "low" : "high",
        found_at: `2026-01-${String(number).padStart(2, "0")}T00:00:00Z`,
      }
    })
  ).findings
  const markup = renderToStaticMarkup(
    createElement(FindingsTable, {
      findings,
      filters: { severity: "high", sort: "oldest" },
      censored: false,
      onToggleCensored: () => {},
      onFilters: () => {},
      onFinding: () => {},
    })
  )

  expect(markup.match(/aria-label="Open finding:/g)).toHaveLength(20)
  expect(markup).toContain('aria-label="Open finding: Finding 1"')
  expect(markup).not.toContain('aria-label="Open finding: Finding 2"')
  expect(markup).not.toContain('aria-label="Open finding: Finding 28"')
  expect(markup).toContain("Showing 1–20 of 23 findings")
  expect(markup).toContain("Page 1 of 2")
  const results = markup.match(
    /<div[^>]*aria-label="Findings results"[^>]*>/
  )?.[0]
  expect(results).toBeDefined()
  expect(results || "").toContain('role="region"')
  expect(results || "").toContain('tabindex="-1"')
  const controls = markup.match(
    /<nav aria-label="Findings pagination"[\s\S]*?<\/nav>/
  )?.[0]
  expect(controls).toMatch(/<button[^>]*disabled[^>]*>Previous<\/button>/)
  expect(controls?.match(/<button[^>]*>Next<\/button>/)?.[0]).not.toContain(
    ' disabled=""'
  )
})

test("single and empty results omit page controls", () => {
  const findings = normalizeDataset([{ title: "Only finding" }]).findings
  const render = (filters: { query?: string }) =>
    renderToStaticMarkup(
      createElement(FindingsTable, {
        findings,
        filters,
        censored: false,
        onToggleCensored: () => {},
        onFilters: () => {},
        onFinding: () => {},
      })
    )

  const single = render({})
  expect(single).toMatch(/>Showing 1–1 of 1 finding</)
  expect(single).not.toContain('aria-label="Findings pagination"')
  const empty = render({ query: "not present" })
  expect(empty).toContain("0 findings")
  expect(empty).not.toContain('aria-label="Findings pagination"')
})
