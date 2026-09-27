import { describe, expect, test } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { FindingsTable } from "../src/components/findings-table"
import {
  normalizeDataset,
  selectFindings,
  summarize,
  groupFindingClasses,
} from "../src/lib/findings"

describe("Hermes output import", () => {
  test("normalizes scan outcomes into confirmed, candidate, and false positive", () => {
    const data = normalizeDataset([
      { title: "Valid", status: "true positive", verified: true },
      { title: "Unchecked", status: "candidate", verified: true },
      { title: "Rejected", status: "False-Positive", verified: true },
      { title: "New" },
    ])
    expect(data.findings.map((finding) => finding.status)).toEqual([
      "confirmed",
      "candidate",
      "false_positive",
      "candidate",
    ])
    expect(data.findings.map((finding) => finding.verified)).toEqual([
      true,
      false,
      false,
      false,
    ])
    expect(
      selectFindings(data.findings, { status: "false_positive" })
    ).toHaveLength(1)
    expect(summarize(data).candidate).toBe(2)
    expect(summarize(data).falsePositive).toBe(1)
    expect(data.findings[2].raw.status).toBe("False-Positive")
  })
  test("accepts envelopes and preserves original evidence fields", () => {
    const raw = {
      id: "h-1",
      title: "Order access",
      severity: "HIGH",
      status: "confirmed",
      vulnerability_type: "IDOR",
      url: "https://api.example.com/orders/1",
      payload: "<script>test</script>",
      custom_evidence: { verified: true },
    }
    const data = normalizeDataset({ findings: [raw] })
    expect(data.findings[0].severity).toBe("high")
    expect(data.findings[0].host).toBe("api.example.com")
    expect(data.findings[0].raw).toEqual(raw)
    expect(data.findings[0].cvss).toBeNull()
  })
  test("accepts a single finding and defaults unknown severity to info", () => {
    expect(
      normalizeDataset({ title: "A finding", severity: "unexpected" })
        .findings[0].severity
    ).toBe("info")
  })
  test("reports invalid records and rejects invalid documents", () => {
    const data = normalizeDataset([
      { title: "Valid" },
      null,
      { severity: "high" },
    ])
    expect(data.findings).toHaveLength(1)
    expect(data.warnings).toHaveLength(2)
    expect(() => normalizeDataset({ not_findings: true })).toThrow()
    expect(() => normalizeDataset([null])).toThrow()
    expect(normalizeDataset({ findings: [] }).findings).toHaveLength(0)
  })
  test("does not invent missing asset coverage", () => {
    const stats = summarize(
      normalizeDataset([{ title: "A finding", host: "api.example.com" }])
    )
    expect(stats.targets).toBe(1)
    expect(stats.subdomains).toBeNull()
    expect(stats.endpoints).toBeNull()
  })
  test("preserves supplied target coverage", () => {
    const data = normalizeDataset({
      findings: [],
      targets: [
        { name: "Example", host: "example.com", subdomains: 12, endpoints: 45 },
      ],
    })
    expect(summarize(data).endpoints).toBe(45)
    expect(summarize(data).subdomains).toBe(12)
  })
  test("ensures unique IDs even when an input ID matches a generated suffix", () => {
    const data = normalizeDataset([
      { id: "a", title: "First" },
      { id: "a-3", title: "Second" },
      { id: "a", title: "Third" },
    ])
    expect(new Set(data.findings.map((f) => f.id)).size).toBe(3)
  })
  test("rejects malformed targets and deduplicates target hosts with warnings", () => {
    const data = normalizeDataset({
      findings: [],
      targets: [
        {},
        { host: 42 },
        { name: "Good", host: "example.test", endpoints: 25 },
        { host: "example.test", endpoints: 10 },
      ],
    })
    expect(data.targets).toHaveLength(1)
    expect(summarize(data).targets).toBe(1)
    expect(summarize(data).endpoints).toBe(25)
    expect(data.warnings).toHaveLength(3)
  })
  test("counts classes named like object prototype properties", () => {
    const data = normalizeDataset([
      { title: "One", vulnerability_type: "constructor" },
      { title: "Two", vulnerability_type: "constructor" },
      { title: "Three", vulnerability_type: "__proto__" },
    ])
    expect(groupFindingClasses(data.findings)).toEqual([
      ["constructor", 2],
      ["__proto__", 1],
    ])
  })
})

describe("finding exploration", () => {
  test("Other findings render with their category and remain selectable in the asset filter", () => {
    const data = normalizeDataset({
      title: "Mobile storage issue",
      asset_type: "other",
    })
    const markup = renderToStaticMarkup(
      createElement(FindingsTable, {
        findings: data.findings,
        filters: { assetType: "other" },
        censored: false,
        onToggleCensored: () => {},
        onFilters: () => {},
        onFinding: () => {},
      })
    )
    expect(markup).toContain("Mobile storage issue")
    expect(markup).toContain("Other")
    expect(markup).not.toContain("No findings match")
  })
  test("routes non-web and non-contract findings to Other while preserving explicit categories and raw records", () => {
    const rows = [
      {
        title: "Mobile storage",
        asset_type: "other",
        host: "device-1",
        source_file: "app/storage.ts",
      },
      {
        title: "Desktop issue",
        asset_type: "desktop",
        url: "https://example.test/help",
      },
      { title: "Unspecified finding" },
      { title: "Legacy web", url: "https://example.test" },
      { title: "Legacy contract", contract_address: "0x1111" },
      { title: "Explicit web", asset_type: "web" },
      { title: "Explicit contract", asset_type: "Smart-Contract" },
      {
        title: "Other with contract evidence",
        asset_type: "OTHER",
        contract_address: "0x2222",
      },
    ]
    const data = normalizeDataset(rows)
    expect(data.findings.map((finding) => finding.assetType)).toEqual([
      "other",
      "other",
      "other",
      "web",
      "smart_contract",
      "web",
      "smart_contract",
      "other",
    ])
    const other = selectFindings(data.findings, { assetType: "other" })
    expect(other).toHaveLength(4)
    expect(other.every((finding) => finding.method === "—")).toBe(true)
    expect(data.findings[3].method).toBe("GET")
    expect(data.findings[0].sourceFile).toBe("app/storage.ts")
    expect(data.findings[0].raw).toEqual(rows[0])
    expect(summarize(data).total).toBe(rows.length)
  })
  test("imports and searches smart contract metadata without inventing HTTP methods", () => {
    const raw = {
      title: "Missing configuration authorization",
      asset_type: "smart_contract",
      chain: "Local EVM",
      chain_id: 31337,
      contract_address: "0x1111111111111111111111111111111111111111",
      contract_name: "Treasury",
      function_name: "setConfig",
      source_file: "src/Treasury.sol",
      source_line: 42,
    }
    const data = normalizeDataset(raw)
    expect(data.findings[0].assetType).toBe("smart_contract")
    expect(data.findings[0].contractName).toBe("Treasury")
    expect(data.findings[0].sourceLine).toBe(42)
    expect(data.findings[0].method).toBe("—")
    expect(
      selectFindings(data.findings, {
        assetType: "smart_contract",
        query: "Treasury",
      })
    ).toHaveLength(1)
    expect(selectFindings(data.findings, { assetType: "web" })).toHaveLength(0)
  })
  const records = [
    {
      id: "a",
      title: "Order access",
      host: "api.example.com",
      severity: "high",
      status: "confirmed",
      vulnerability_type: "IDOR",
      found_at: "2026-09-24",
    },
    {
      id: "b",
      title: "Search reflection",
      severity: "medium",
      vulnerability_type: "XSS",
      payload: "UNIQUE",
      found_at: "2026-09-25",
    },
    { id: "c", title: "Unknown date", severity: "critical" },
  ]
  test("combines case insensitive search and filters", () => {
    const data = normalizeDataset(records)
    expect(
      selectFindings(data.findings, {
        query: "API.EXAMPLE",
        severity: "high",
        status: "confirmed",
        type: "IDOR",
        sort: "newest",
      }).map((f) => f.id)
    ).toEqual(["a"])
    expect(
      selectFindings(data.findings, { query: "unique" }).map((f) => f.id)
    ).toEqual(["b"])
  })
  test("sorts known dates first and supports severity order", () => {
    const data = normalizeDataset(records)
    expect(
      selectFindings(data.findings, { sort: "newest" }).map((f) => f.id)
    ).toEqual(["b", "a", "c"])
    expect(
      selectFindings(data.findings, { sort: "severity" }).map((f) => f.id)
    ).toEqual(["c", "a", "b"])
  })
})
