export const severities = ["critical", "high", "medium", "low", "info"] as const
export type Severity = (typeof severities)[number]
export const assetTypes = ["web", "smart_contract", "other"] as const
export type AssetType = (typeof assetTypes)[number]
export const assetTypeLabels: Record<AssetType, string> = {
  web: "Web",
  smart_contract: "Smart contract",
  other: "Other",
}
export const findingStatuses = [
  "confirmed",
  "candidate",
  "false_positive",
] as const
export type FindingStatus = (typeof findingStatuses)[number]
export const statusInfo = {
  confirmed: {
    label: "Confirmed",
    description: "True positive — scan and verification completed.",
  },
  candidate: {
    label: "Candidate",
    description: "Not yet scanned or verified.",
  },
  false_positive: {
    label: "False positive",
    description: "Scan and verification completed; finding is not valid.",
  },
} satisfies Record<FindingStatus, { label: string; description: string }>
export type Finding = {
  id: string
  project: string
  sourcePath: string
  title: string
  severity: Severity
  status: FindingStatus
  type: string
  assetType: AssetType
  chain: string
  chainId: string
  contractAddress: string
  contractName: string
  functionName: string
  sourceFile: string
  sourceLine: number | null
  host: string
  url: string
  parameter: string
  method: string
  foundAt: string | null
  cvss: number | null
  vector: string
  verified: boolean
  impact: string
  delivery: string
  exposure: string
  harm: string
  steps: string[]
  payload: string
  evidence: string[]
  raw: Record<string, unknown>
}
export type Target = {
  name: string
  host: string
  subdomains: number | null
  endpoints: number | null
  lastScan: string | null
}
export type Dataset = {
  findings: Finding[]
  targets: Target[]
  warnings: string[]
}
export type Filters = {
  query?: string
  severity?: string
  status?: string
  type?: string
  assetType?: string
  project?: string
  sort?: string
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}
function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}
function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null
}
function date(value: unknown): string | null {
  const text = str(value)
  return text && Number.isFinite(Date.parse(text)) ? text : null
}
function lines(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : str(value).split("\n").filter(Boolean)
}

export function normalizeDataset(input: unknown): Dataset {
  let rows: unknown[]
  if (Array.isArray(input)) rows = input
  else if (record(input) && Array.isArray(input.findings)) rows = input.findings
  else if (record(input) && typeof input.title === "string") rows = [input]
  else
    throw new Error(
      "Expected a finding, an array, or a JSON object with a findings array."
    )
  const warnings: string[] = [],
    findings: Finding[] = [],
    ids = new Set<string>()
  rows.forEach((row, index) => {
    if (!record(row) || !str(row.title).trim()) {
      warnings.push(`Record ${index + 1}: a non-empty title is required.`)
      return
    }
    const url = str(row.url)
    const contractAddress = str(row.contract_address ?? row.contractAddress)
    const inputAssetType = str(row.asset_type ?? row.assetType)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
    const assetType: AssetType = inputAssetType
      ? inputAssetType === "web" || inputAssetType === "smart_contract"
        ? inputAssetType
        : "other"
      : contractAddress
        ? "smart_contract"
        : url || str(row.host) || str(row.method) || str(row.parameter)
          ? "web"
          : "other"
    let host = str(row.host)
    if (!host && url) {
      try {
        host = new URL(url).host
      } catch {
        /* Keep invalid URLs as text. */
      }
    }
    const severity = str(row.severity, "info").toLowerCase()
    if (!severities.includes(severity as Severity))
      warnings.push(`Record ${index + 1}: unknown severity displayed as info.`)
    let id = str(row.id, `finding-${index + 1}`)
    if (ids.has(id)) {
      warnings.push(
        `Record ${index + 1}: duplicate ID assigned a unique suffix.`
      )
      const base = id
      let suffix = index + 1
      do {
        id = `${base}-${suffix++}`
      } while (ids.has(id))
    }
    ids.add(id)
    const cvssRecord = record(row.cvss) ? row.cvss : null
    const score = number(row.cvss_score ?? cvssRecord?.score ?? row.cvss)
    const inputStatus = str(row.status, "candidate")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
    const status: FindingStatus =
      inputStatus === "confirmed" || inputStatus === "true_positive"
        ? "confirmed"
        : inputStatus === "false_positive"
          ? "false_positive"
          : "candidate"
    if (
      !["confirmed", "true_positive", "candidate", "false_positive"].includes(
        inputStatus
      )
    )
      warnings.push(
        `Record ${index + 1}: unknown status displayed as candidate.`
      )
    findings.push({
      id,
      project: str(row.project),
      sourcePath: str(row.source_path),
      title: str(row.title).trim(),
      severity: severities.includes(severity as Severity)
        ? (severity as Severity)
        : "info",
      status,
      type: str(
        row.vulnerability_type ?? row.type ?? row.class,
        "Unclassified"
      ),
      assetType,
      chain: str(row.chain ?? row.network),
      chainId:
        typeof row.chain_id === "number"
          ? String(row.chain_id)
          : str(row.chain_id),
      contractAddress,
      contractName: str(row.contract_name ?? row.contractName),
      functionName: str(row.function_name ?? row.function),
      sourceFile: str(row.source_file ?? row.file),
      sourceLine: number(row.source_line ?? row.line),
      host: host || contractAddress || "Unknown host",
      url,
      parameter: str(row.parameter),
      method: str(row.method, assetType === "web" ? "GET" : "—").toUpperCase(),
      foundAt: date(
        row.found_at ?? row.discovered_at ?? row.created_at ?? row.timestamp
      ),
      cvss: score !== null && score <= 10 ? score : null,
      vector: str(row.cvss_vector ?? cvssRecord?.vector),
      verified:
        status === "confirmed" &&
        (row.verified === true || row.verification_status === "verified"),
      impact: str(row.impact ?? row.description),
      delivery: str(row.deliverability ?? row.delivery),
      exposure: str(row.data_exposure),
      harm: str(row.harm),
      steps: lines(row.steps_to_reproduce ?? row.steps),
      payload: str(row.payload),
      evidence: lines(row.evidence ?? row.attachments ?? row.proof_of_concept),
      raw: row,
    })
  })
  if (rows.length && !findings.length)
    throw new Error("No valid findings. Every finding needs a non-empty title.")
  const rawTargets =
    record(input) && Array.isArray(input.targets) ? input.targets : []
  const targets: Target[] = [],
    targetHosts = new Set<string>()
  rawTargets.forEach((t, index) => {
    if (!record(t) || !str(t.host).trim()) {
      warnings.push(`Target ${index + 1}: a non-empty host is required.`)
      return
    }
    const host = str(t.host).trim()
    if (targetHosts.has(host)) {
      warnings.push(`Target ${index + 1}: duplicate host skipped.`)
      return
    }
    targetHosts.add(host)
    targets.push({
      name: str(t.name).trim() || host,
      host,
      subdomains: number(t.subdomains),
      endpoints: number(t.endpoints),
      lastScan: date(t.last_scan),
    })
  })
  return { findings, targets, warnings }
}

export function selectFindings(
  findings: Finding[],
  filters: Filters = {}
): Finding[] {
  const query = (filters.query || "").trim().toLowerCase()
  return findings
    .filter(
      (f) =>
        (!query ||
          [
            f.title,
            f.host,
            f.parameter,
            f.payload,
            f.type,
            f.id,
            f.chain,
            f.chainId,
            f.contractAddress,
            f.contractName,
            f.functionName,
            f.sourceFile,
            f.project,
            f.sourcePath,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)) &&
        (!filters.severity ||
          filters.severity === "all" ||
          f.severity === filters.severity) &&
        (!filters.status ||
          filters.status === "all" ||
          f.status === filters.status) &&
        (!filters.type || filters.type === "all" || f.type === filters.type) &&
        (!filters.assetType ||
          filters.assetType === "all" ||
          f.assetType === filters.assetType) &&
        (!filters.project ||
          filters.project === "all" ||
          f.project === filters.project)
    )
    .sort((a, b) => {
      if (filters.sort === "severity")
        return severities.indexOf(a.severity) - severities.indexOf(b.severity)
      if (!a.foundAt) return b.foundAt ? 1 : 0
      if (!b.foundAt) return -1
      const difference = Date.parse(b.foundAt) - Date.parse(a.foundAt)
      return filters.sort === "oldest" ? -difference : difference
    })
}

export function summarize(data: Dataset) {
  const complete = (key: "subdomains" | "endpoints") =>
    data.targets.length && data.targets.every((t) => t[key] !== null)
      ? data.targets.reduce((sum, t) => sum + (t[key] || 0), 0)
      : null
  return {
    total: data.findings.length,
    confirmed: data.findings.filter((f) => f.status === "confirmed").length,
    candidate: data.findings.filter((f) => f.status === "candidate").length,
    falsePositive: data.findings.filter((f) => f.status === "false_positive")
      .length,
    verified: data.findings.filter((f) => f.verified).length,
    targets:
      data.targets.length ||
      new Set(
        data.findings
          .filter((f) => f.host !== "Unknown host")
          .map((f) => f.host)
      ).size,
    subdomains: complete("subdomains"),
    endpoints: complete("endpoints"),
    severity: Object.fromEntries(
      severities.map((s) => [
        s,
        data.findings.filter((f) => f.severity === s).length,
      ])
    ) as Record<Severity, number>,
  }
}
export function groupFindingClasses(findings: Finding[]): [string, number][] {
  const counts = new Map<string, number>()
  findings.forEach((f) => counts.set(f.type, (counts.get(f.type) || 0) + 1))
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
}

export function relativeDate(value: string | null): string {
  if (!value) return "Unknown"
  const hours = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 3_600_000)
  )
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
