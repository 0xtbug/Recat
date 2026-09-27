import type { Finding } from "./findings"

export function maskFinding(finding: Finding): Finding {
  const mask = (value: string) => (value ? "***" : "")
  return {
    ...finding,
    id: "***",
    title: "***",
    project: mask(finding.project),
    sourcePath: mask(finding.sourcePath),
    host: "***",
    url: mask(finding.url),
    contractAddress: mask(finding.contractAddress),
    contractName: mask(finding.contractName),
    functionName: mask(finding.functionName),
    sourceFile: mask(finding.sourceFile),
    sourceLine: null,
    parameter: mask(finding.parameter),
    impact: mask(finding.impact),
    delivery: mask(finding.delivery),
    exposure: mask(finding.exposure),
    harm: mask(finding.harm),
    steps: finding.steps.map(() => "***"),
    payload: mask(finding.payload),
    evidence: [],
    raw: { redacted: "***" },
  }
}
