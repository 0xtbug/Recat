import {
  RiSearchLine,
  RiArrowRightUpLine,
  RiFilterOffLine,
  RiEyeOffLine,
  RiEyeLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SeverityBadge } from "./severity-badge"
import { StatusBadge } from "./status-badge"
import { maskFinding } from "@/lib/censor"
import {
  selectFindings,
  relativeDate,
  severities,
  findingStatuses,
  statusInfo,
  assetTypes,
  assetTypeLabels,
  type Finding,
  type Filters,
} from "@/lib/findings"

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  options: { value: string; label: string }[]
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v || "all")}
      items={options}
    >
      <SelectTrigger aria-label={label} className="">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function FindingsTable({
  censored,
  onToggleCensored,
  findings,
  filters,
  onFilters,
  onFinding,
}: {
  censored: boolean
  onToggleCensored: () => void
  findings: Finding[]
  filters: Filters
  onFilters: (filters: Filters) => void
  onFinding: (f: Finding) => void
}) {
  const shown = selectFindings(findings, filters)
  const set = (key: keyof Filters, value: string) =>
    onFilters({ ...filters, [key]: value })
  const active =
    filters.query ||
    (filters.severity && filters.severity !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.type && filters.type !== "all") ||
    (filters.assetType && filters.assetType !== "all") ||
    (filters.project && filters.project !== "all")
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupInput
            aria-label="Search findings"
            placeholder="Search title, host, contract, function…"
            type={censored ? "password" : "text"}
            value={filters.query || ""}
            onChange={(e) => set("query", e.target.value)}
          />
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={filters.project || "all"}
            onChange={(v) => set("project", v)}
            label="Project"
            options={[
              { value: "all", label: "All projects" },
              ...Array.from(
                new Set(findings.map((f) => f.project).filter(Boolean))
              )
                .sort()
                .map((project, index) => ({
                  value: project,
                  label: censored ? `*** ${index + 1}` : project,
                })),
            ]}
          />
          <Button
            variant={censored ? "default" : "outline"}
            aria-pressed={censored}
            onClick={onToggleCensored}
            title="Mask identifying details, payloads, and evidence with ***"
          >
            {censored ? <RiEyeOffLine /> : <RiEyeLine />}
            Censored mode
          </Button>
          <FilterSelect
            value={filters.assetType || "all"}
            onChange={(v) => set("assetType", v)}
            label="Asset type"
            options={[
              { value: "all", label: "All assets" },
              ...assetTypes.map((value) => ({
                value,
                label: assetTypeLabels[value],
              })),
            ]}
          />
          <FilterSelect
            value={filters.type || "all"}
            onChange={(v) => set("type", v)}
            label="Vulnerability class"
            options={[
              { value: "all", label: "All classes" },
              ...Array.from(new Set(findings.map((f) => f.type)))
                .sort()
                .map((t) => ({ value: t, label: t })),
            ]}
          />
          <FilterSelect
            value={filters.sort || "newest"}
            onChange={(v) => set("sort", v)}
            label="Sort findings"
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "severity", label: "Highest severity" },
            ]}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={
              !filters.severity || filters.severity === "all"
                ? "default"
                : "outline"
            }
            onClick={() => set("severity", "all")}
          >
            All severities<Badge variant="secondary">{findings.length}</Badge>
          </Button>
          {severities
            .filter((s) => findings.some((f) => f.severity === s))
            .map((s) => (
              <Button
                variant={filters.severity === s ? "default" : "outline"}
                aria-pressed={filters.severity === s}
                key={s}
                onClick={() =>
                  set("severity", filters.severity === s ? "all" : s)
                }
              >
                <span className="capitalize">{s}</span>
                <span className="opacity-70">
                  {findings.filter((f) => f.severity === s).length}
                </span>
              </Button>
            ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Separator orientation="vertical" className="mr-1 h-6 self-center" />
          {findingStatuses.map((s) => (
            <Button
              key={s}
              variant={filters.status === s ? "default" : "outline"}
              aria-pressed={filters.status === s}
              title={statusInfo[s].description}
              onClick={() => set("status", filters.status === s ? "all" : s)}
            >
              {statusInfo[s].label}
              <Badge variant="secondary">
                {findings.filter((finding) => finding.status === s).length}
              </Badge>
            </Button>
          ))}
          {active && (
            <Button
              variant="ghost"
              onClick={() => onFilters({ sort: filters.sort })}
              className="text-muted-foreground"
            >
              <RiFilterOffLine />
              Clear
            </Button>
          )}
        </div>
      </div>
      <Card className="">
        <Table className="">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[112px]">Severity</TableHead>
              <TableHead>Finding</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Parameter / Function</TableHead>
              <TableHead>Method / Network</TableHead>
              <TableHead>Found</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((original, index) => {
              const f = censored ? maskFinding(original) : original
              return (
                <TableRow
                  key={original.id}
                  className="cursor-pointer"
                  onClick={() => onFinding(original)}
                >
                  <TableCell>
                    <SeverityBadge severity={f.severity} />
                  </TableCell>
                  <TableCell className="max-w-md min-w-64">
                    <Button
                      variant="link"
                      onClick={(e) => {
                        e.stopPropagation()
                        onFinding(original)
                      }}
                      className="max-w-full justify-start truncate"
                      aria-label={
                        censored
                          ? `Open censored finding ${index + 1}`
                          : `Open finding: ${f.title}`
                      }
                    >
                      {f.title}
                    </Button>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {f.host}
                      <span className="mx-2 opacity-40">/</span>
                      <span>{f.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{f.project || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {assetTypeLabels[f.assetType]}
                    </Badge>
                  </TableCell>
                  <TableCell>{f.type}</TableCell>
                  <TableCell>
                    {f.functionName || f.parameter ? (
                      <code>{f.functionName || f.parameter}</code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span>
                      {f.assetType === "smart_contract"
                        ? f.chain || "—"
                        : f.method}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {relativeDate(f.foundAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={f.status} />
                  </TableCell>
                  <TableCell>
                    <RiArrowRightUpLine className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {!shown.length && (
          <div className="flex flex-col items-center gap-3 p-8">
            <RiSearchLine className="size-8 text-muted-foreground" />
            <h3>No findings match</h3>
            <p>
              {findings.length
                ? "Try a different search or clear your filters."
                : "Add findings JSON to your source folder, or set its path in Settings."}
            </p>
            {active && (
              <Button variant="outline" onClick={() => onFilters({})}>
                Clear filters
              </Button>
            )}
          </div>
        )}
        <div className="flex justify-between gap-3 px-4 text-xs text-muted-foreground">
          <span>
            {shown.length} finding{shown.length === 1 ? "" : "s"}
          </span>
        </div>
      </Card>
    </div>
  )
}
