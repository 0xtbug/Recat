import { expect, test } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Dashboard } from "../src/components/dashboard"
import { normalizeDataset, summarize } from "../src/lib/findings"

function coverageMarkup(data: ReturnType<typeof normalizeDataset>) {
  const markup = renderToStaticMarkup(
    createElement(Dashboard, {
      data,
      onFinding: () => {},
      onExplore: () => {},
    })
  )
  const start = markup.indexOf("<h2>Target coverage</h2>")
  const end = markup.indexOf("<h2>Recent findings</h2>", start)
  return markup.slice(start, end)
}

test("target coverage keeps reported counts and includes finding hosts without target records", () => {
  const data = normalizeDataset({
    findings: [
      { title: "Known host finding", host: "API.EXAMPLE.COM" },
      { title: "Other host finding", host: "other.example.com" },
    ],
    targets: [
      {
        name: "API",
        host: "api.example.com",
        subdomains: 9,
        endpoints: 42,
      },
    ],
  })
  const coverage = coverageMarkup(data)
  expect(summarize(data).targets).toBe(2)
  expect(summarize(data).subdomains).toBe(9)
  expect(summarize(data).endpoints).toBe(42)
  expect(coverage).toContain("API")
  expect(coverage).toContain("other.example.com")
  expect(coverage).toContain(">9</td>")
  expect(coverage).toContain(">42</td>")
})

test("inferred hosts show one host label, finding counts, and clear unknown coverage", () => {
  const host = "a-very-long-unbroken-hostname-with-no-mapped-counts.example.test"
  const data = normalizeDataset({
    findings: [
      { title: "First", host },
      { title: "Second", host },
    ],
  })
  const coverage = coverageMarkup(data)
  expect(coverage).toContain("No mapped counts reported")
  expect(coverage.split(`>${host}</div>`)).toHaveLength(2)
  expect(coverage).toContain("Findings")
  expect(coverage).toContain(">2</td>")
  expect(coverage).toContain("table-fixed")
  expect(coverage).toContain("max-h-72")
})

test("summary distinguishes partial target coverage from no imported coverage", () => {
  const data = normalizeDataset({
    findings: [],
    targets: [
      { host: "first.example.com", subdomains: 9, endpoints: 42 },
      { host: "second.example.com", endpoints: 5 },
    ],
  })
  const markup = renderToStaticMarkup(
    createElement(Dashboard, {
      data,
      onFinding: () => {},
      onExplore: () => {},
    })
  )
  expect(summarize(data).subdomains).toBeNull()
  expect(summarize(data).endpoints).toBe(47)
  expect(markup).toContain("Coverage incomplete")
  expect(markup).not.toContain("No coverage data imported")
})

test("inferred contracts at one address remain separate across chains", () => {
  const findings = [
    {
      title: "Ethereum issue",
      asset_type: "smart_contract",
      contract_address: "0xabc",
      chain: "Ethereum",
      chain_id: 1,
    },
    {
      title: "Base issue",
      asset_type: "smart_contract",
      contract_address: "0xabc",
      chain: "Base",
      chain_id: 8453,
    },
  ]
  const inferred = normalizeDataset({ findings })
  expect(summarize(inferred).targets).toBe(2)
  const coverage = coverageMarkup(inferred)
  expect(coverage).toContain("Ethereum (1)")
  expect(coverage).toContain("Base (8453)")

  const withoutIds = normalizeDataset({
    findings: findings.map((finding) => ({ ...finding, chain_id: undefined })),
  })
  expect(summarize(withoutIds).targets).toBe(2)
  expect(coverageMarkup(withoutIds)).toContain("Base")

  const reported = normalizeDataset({
    findings,
    targets: [{ name: "Contract target", host: "0xabc", subdomains: 0, endpoints: 0 }],
  })
  expect(summarize(reported).targets).toBe(1)
  expect(coverageMarkup(reported)).toContain("Contract target")
})

test("a contract finding with an explicit host counts toward its imported target", () => {
  const data = normalizeDataset({
    findings: [
      {
        title: "Contract issue",
        asset_type: "smart_contract",
        host: "audit.example.com",
        contract_address: "0xabc",
        chain_id: 1,
      },
    ],
    targets: [
      {
        name: "Audit target",
        host: "audit.example.com",
        subdomains: 0,
        endpoints: 0,
      },
    ],
  })
  expect(summarize(data).targets).toBe(1)
  const coverage = coverageMarkup(data)
  expect(coverage).toContain("Audit target")
  expect(coverage).toContain(">1</td>")
})
