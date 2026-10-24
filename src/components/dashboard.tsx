import { lazy, Suspense, type ReactNode } from "react"
import {
  RiFocus3Line,
  RiBugLine,
  RiGlobalLine,
  RiRouteLine,
  RiArrowRightUpLine,
  RiArrowRightLine,
  RiShieldCheckLine,
} from "@remixicon/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SeverityBadge } from "./severity-badge"
import {
  selectFindings,
  groupFindingClasses,
  relativeDate,
  severities,
  summarize,
  targetCoverageRows,
  type Dataset,
  type Finding,
} from "@/lib/findings"
const ActivityChart = lazy(() =>
  import("./activity-chart").then((module) => ({
    default: module.ActivityChart,
  }))
)

function Panel({
  title,
  note,
  children,
  className = "",
}: {
  title: string
  note?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-2 px-4">
        <h2>{title}</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {note}
        </div>
      </div>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function Dashboard({
  data,
  onFinding,
  onExplore,
}: {
  data: Dataset
  onFinding: (f: Finding) => void
  onExplore: (type?: string, severity?: string) => void
}) {
  const stats = summarize(data)
  const classes = groupFindingClasses(data.findings)
  const maxClass = Math.max(1, ...classes.map((c) => c[1]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(today)
    start.setDate(start.getDate() - (13 - i))
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return {
      date: start,
      count: data.findings.filter(
        (f) =>
          f.foundAt &&
          Date.parse(f.foundAt) >= +start &&
          Date.parse(f.foundAt) < +end
      ).length,
    }
  })
  const windowTotal = days.reduce((sum, d) => sum + d.count, 0)
  const targets = targetCoverageRows(data)
  const hasMappedCounts = data.targets.some(
    (target) => target.subdomains !== null || target.endpoints !== null
  )
  const coverageNote = (key: "subdomains" | "endpoints", total: number | null) =>
    total !== null
      ? "Reported target coverage"
      : data.targets.some((target) => target[key] !== null)
        ? "Coverage incomplete"
        : "No coverage data imported"
  const cards = [
    {
      label: "Smart contract findings",
      value: data.findings.filter((f) => f.assetType === "smart_contract")
        .length,
      icon: RiShieldCheckLine,
      note: "Contract audit discoveries",
    },
    {
      label: "Targets in scope",
      value: stats.targets,
      icon: RiFocus3Line,
      note: "Across your hunting workspace",
    },
    {
      label: "Bugs found",
      value: stats.total,
      icon: RiBugLine,
      note: `${stats.confirmed} confirmed · ${stats.candidate} candidate · ${stats.falsePositive} false positive`,
    },
    {
      label: "Subdomains collected",
      value: stats.subdomains ?? "—",
      icon: RiGlobalLine,
      note: coverageNote("subdomains", stats.subdomains),
    },
    {
      label: "Endpoints mapped",
      value: stats.endpoints ?? "—",
      icon: RiRouteLine,
      note: coverageNote("endpoints", stats.endpoints),
    },
  ]
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <Card className="" key={c.label}>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{c.label}</span>
                <c.icon className="size-[18px] text-muted-foreground" />
              </div>
              <div className="my-3 text-3xl font-semibold">{c.value}</div>
              <p className="text-xs text-muted-foreground">{c.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Panel
        title="Severity overview"
        note={
          <>
            <span className="hidden sm:inline">Risk distribution</span>
            <Badge variant="secondary">{stats.total} findings</Badge>
          </>
        }
      >
        <div className="px-5 pt-5 pb-4">
          <div
            className="flex gap-1"
            aria-label="Finding severity distribution"
          >
            {severities.map(
              (s) =>
                stats.severity[s] > 0 && (
                  <Tooltip key={s}>
                    <TooltipTrigger
                      render={
                        <Button
                          variant={
                            s === "critical"
                              ? "destructive"
                              : s === "high"
                                ? "default"
                                : "secondary"
                          }
                          style={{
                            width: `${(stats.severity[s] / stats.total) * 100}%`,
                          }}
                          onClick={() => onExplore(undefined, s)}
                          aria-label={`${s}: ${stats.severity[s]} findings`}
                        />
                      }
                    />
                    <TooltipContent>
                      {stats.severity[s]} {s} findings
                    </TooltipContent>
                  </Tooltip>
                )
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {severities.map((s) => (
              <Button
                variant="ghost"
                key={s}
                onClick={() => onExplore(undefined, s)}
                className=""
              >
                <span className="capitalize">{s}</span>
                <strong>{stats.severity[s]}</strong>
                <span className="text-muted-foreground">
                  {stats.total
                    ? Math.round((stats.severity[s] / stats.total) * 100)
                    : 0}
                  %
                </span>
              </Button>
            ))}
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Findings by class" note="Click a class to explore">
          <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-72">
            <div className="space-y-1">
              {classes.map(([name, count]) => (
                <Button
                  variant="ghost"
                  className="flex w-full items-center gap-3"
                  key={name}
                  onClick={() => onExplore(name)}
                >
                  <span className="w-36 shrink-0 truncate text-left">
                    {name}
                  </span>
                  <span className="h-2 flex-1 bg-muted [&>span]:block [&>span]:h-full [&>span]:bg-primary">
                    <span style={{ width: `${(count / maxClass) * 100}%` }} />
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </Button>
              ))}
              {!classes.length && (
                <p className="p-4 text-muted-foreground">
                  No findings to classify yet.
                </p>
              )}
            </div>
          </ScrollArea>
        </Panel>
        <Panel
          title="Hunting activity"
          note={
            <span className="flex items-center gap-1.5">
              <span className="" />
              Findings per day
            </span>
          }
        >
          <Suspense
            fallback={
              <div className="flex h-[218px] items-center justify-center text-xs text-muted-foreground">
                Loading activity…
              </div>
            }
          >
            <ActivityChart days={days} />
          </Suspense>
          <div className="mt-4 flex justify-between gap-2 px-4 text-xs text-muted-foreground">
            <span>{windowTotal} findings in this window</span>
            <span>
              {days[0].date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {today.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Target coverage"
          note={hasMappedCounts ? "— means not reported" : "No mapped counts reported"}
        >
          <div
            className="max-h-72 overflow-y-auto"
            role="region"
            aria-label="Target coverage table"
            tabIndex={0}
          >
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[34%] whitespace-normal">Target / Host</TableHead>
                  <TableHead className="w-[12%] px-1 text-right whitespace-normal">Subs</TableHead>
                  <TableHead className="w-[17%] px-1 text-right whitespace-normal">Endpoints</TableHead>
                  <TableHead className="w-[15%] px-1 text-right whitespace-normal">Findings</TableHead>
                  <TableHead className="w-[22%] px-1 text-right whitespace-normal">Last scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((t) => (
                  <TableRow key={t.key}>
                    <TableCell className="min-w-0">
                      <div className="truncate font-medium" title={t.name}>
                        {t.name}
                      </div>
                      {t.name.toLowerCase() !== t.host.toLowerCase() && (
                        <div
                          className="mt-1 truncate text-xs text-muted-foreground"
                          title={t.host}
                        >
                          {t.host}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-1 text-right font-mono tabular-nums">
                      {t.subdomains ?? "—"}
                    </TableCell>
                    <TableCell className="px-1 text-right font-mono tabular-nums">
                      {t.endpoints ?? "—"}
                    </TableCell>
                    <TableCell className="px-1 text-right font-mono tabular-nums">
                      {t.findingCount}
                    </TableCell>
                    <TableCell className="px-1 text-right text-muted-foreground">
                      {t.lastScan ? relativeDate(t.lastScan) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!targets.length && (
            <p className="p-4 text-muted-foreground">
              Import findings or target coverage to see hosts here.
            </p>
          )}
          {targets.length > 0 && data.targets.length === 0 && (
            <p className="px-2 pt-3 text-xs text-muted-foreground">
              Hosts come from findings. Import target records to show mapped
              subdomains and endpoints.
            </p>
          )}
        </Panel>
        <Panel
          title="Recent findings"
          note={
            <Button variant="link" onClick={() => onExplore()} className="">
              View all
              <RiArrowRightLine />
            </Button>
          }
        >
          <div className="space-y-2">
            {selectFindings(data.findings, { sort: "newest" })
              .slice(0, 4)
              .map((f) => (
                <Button
                  key={f.id}
                  variant="ghost"
                  className="flex h-auto w-full items-center gap-2 text-left"
                  onClick={() => onFinding(f)}
                >
                  <SeverityBadge severity={f.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{f.title}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {f.host}
                    </div>
                  </div>
                  <RiArrowRightUpLine className="size-4 text-muted-foreground" />
                </Button>
              ))}
            {!data.findings.length && (
              <p className="p-4 text-muted-foreground">
                Your next discovery will appear here.
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <RiShieldCheckLine className="size-4" />
            {stats.verified} findings verified with supporting evidence
          </div>
        </Panel>
      </div>
    </div>
  )
}
