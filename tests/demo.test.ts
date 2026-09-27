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
