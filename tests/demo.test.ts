import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { demoDataset } from "../src/lib/demo"
import { normalizeDataset, selectFindings } from "../src/lib/findings"

test("demo and downloadable sample include Other findings without invented verification or HTTP methods", () => {
  const sample = normalizeDataset(
    JSON.parse(
      readFileSync(
        new URL("../public/recat-sample.json", import.meta.url),
        "utf8"
      )
    )
  )
  for (const dataset of [demoDataset, sample]) {
    expect(dataset.warnings).toEqual([])
    const other = selectFindings(dataset.findings, { assetType: "other" })
    expect(other).toHaveLength(3)
    expect(new Set(other.map((finding) => finding.id)).size).toBe(3)
    expect(
      other.every(
        (finding) => finding.status === "candidate" && !finding.verified
      )
    ).toBe(true)
    expect(other.every((finding) => finding.method === "—")).toBe(true)
    expect(other.map((finding) => finding.raw.platform)).toEqual([
      "Android",
      "Windows",
      "Network appliance",
    ])
  }
})

test("every demo finding supplies the impact panels and a documented fictional CVSS assessment", () => {
  const sample = normalizeDataset(
    JSON.parse(
      readFileSync(
        new URL("../public/recat-sample.json", import.meta.url),
        "utf8"
      )
    )
  )
  for (const dataset of [demoDataset, sample]) {
    expect(dataset.findings).toHaveLength(23)
    for (const finding of dataset.findings) {
      expect(finding.delivery.trim().length).toBeGreaterThan(20)
      expect(finding.exposure.trim().length).toBeGreaterThan(20)
      expect(finding.harm.trim().length).toBeGreaterThan(20)
      expect(finding.cvss).not.toBeNull()
      expect(finding.vector).toMatch(
        /^CVSS:3\.1\/AV:[NALP]\/AC:[LH]\/PR:[NLH]\/UI:[NR]\/S:[UC]\/C:[NLH]\/I:[NLH]\/A:[NLH]$/
      )
      expect(finding.raw.cvss_rationale).toBeTruthy()
      expect(finding.raw.demo_note).toContain("Fictional")
    }
  }
})
