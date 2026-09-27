import { expect, test } from "bun:test"
import { normalizeDataset } from "../src/lib/findings"
import { maskFinding } from "../src/lib/censor"

test("censored findings hide identifying data and evidence without mutating source records", () => {
  const finding = normalizeDataset({
    title: "Secret target finding",
    id: "private-id",
    status: "confirmed",
    severity: "high",
    project: "Private project",
    host: "private.test",
    url: "https://private.test/path",
    payload: "secret payload",
    evidence: ["private-proof.md"],
    steps: ["Sensitive step"],
    impact: "Private impact",
    contract_address: "0xsecret",
  }).findings[0]
  const masked = maskFinding(finding)
  expect(masked.title).toBe("***")
  expect(masked.id).toBe("***")
  expect(masked.host).toBe("***")
  expect(masked.project).toBe("***")
  expect(masked.evidence).toEqual([])
  expect(masked.raw).toEqual({ redacted: "***" })
  expect(masked.status).toBe("confirmed")
  expect(masked.severity).toBe("high")
  expect(JSON.stringify(masked)).not.toContain("private.test")
  expect(finding.host).toBe("private.test")
  expect(finding.evidence).toEqual(["private-proof.md"])
})
