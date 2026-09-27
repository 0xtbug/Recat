import { useEffect, useRef, useState } from "react"
import {
  RiCheckLine,
  RiFileCopyLine,
  RiDownloadLine,
  RiShieldCheckLine,
} from "@remixicon/react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SeverityBadge } from "./severity-badge"
import { assetTypeLabels, type Finding } from "@/lib/findings"
import { JsonDownload } from "./json-download"
import { useIsMobile } from "@/hooks/use-mobile"
import { EvidenceViewer } from "./evidence-viewer"
import { ProjectDownload } from "./project-download"
import { StatusBadge } from "./status-badge"
import { maskFinding } from "@/lib/censor"

const DEFAULT_DETAIL_WIDTH = 384
const MIN_DETAIL_WIDTH = 320
function clampDetailWidth(width: number) {
  return Math.round(
    Math.min(
      Math.max(MIN_DETAIL_WIDTH, width),
      Math.max(MIN_DETAIL_WIDTH, window.innerWidth - 48)
    )
  )
}

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string
  label?: string
}) {
  const [state, setState] = useState("idle")
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState("copied")
    } catch {
      setState("failed")
    }
    setTimeout(() => setState("idle"), 2500)
  }
  return (
    <Button size="sm" variant="outline" onClick={copy}>
      {state === "copied" ? <RiCheckLine /> : <RiFileCopyLine />}
      {state === "copied"
        ? "Copied"
        : state === "failed"
          ? "Copy failed"
          : label}
    </Button>
  )
}

export function FindingDetail({
  finding,
  censored = false,
  onClose,
}: {
  finding: Finding | null
  censored?: boolean
  onClose: () => void
}) {
  finding = censored && finding ? maskFinding(finding) : finding
  const isMobile = useIsMobile()
  const [width, setWidth] = useState(DEFAULT_DETAIL_WIDTH)
  const drag = useRef<{ x: number; width: number } | null>(null)
  useEffect(() => {
    const resize = () => setWidth((current) => clampDetailWidth(current))
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])
  return (
    <Sheet
      open={!!finding}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        side="right"
        style={{
          width: isMobile ? "100%" : `min(${width}px, calc(100vw - 48px))`,
          maxWidth: "100vw",
        }}
      >
        {!isMobile && (
          <div
            role="separator"
            aria-label="Resize finding details"
            aria-orientation="vertical"
            aria-valuemin={MIN_DETAIL_WIDTH}
            aria-valuemax={Math.max(MIN_DETAIL_WIDTH, window.innerWidth - 48)}
            aria-valuenow={width}
            aria-valuetext={`${width} pixels wide`}
            tabIndex={0}
            title="Drag to resize · Arrow keys to adjust · Double-click to reset"
            className="absolute inset-y-0 -left-1 z-10 flex w-2 cursor-col-resize touch-none justify-center select-none focus-visible:outline focus-visible:outline-ring"
            onPointerDown={(event) => {
              if (event.button !== 0) return
              event.preventDefault()
              event.currentTarget.focus()
              drag.current = {
                x: event.clientX,
                width:
                  event.currentTarget.parentElement?.getBoundingClientRect()
                    .width || width,
              }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (drag.current)
                setWidth(
                  clampDetailWidth(
                    drag.current.width + drag.current.x - event.clientX
                  )
                )
            }}
            onPointerUp={(event) => {
              drag.current = null
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onLostPointerCapture={() => {
              drag.current = null
            }}
            onPointerCancel={() => {
              drag.current = null
            }}
            onDoubleClick={() =>
              setWidth(clampDetailWidth(DEFAULT_DETAIL_WIDTH))
            }
            onKeyDown={(event) => {
              const step = event.shiftKey ? 64 : 16
              if (event.key === "ArrowLeft")
                setWidth((current) => clampDetailWidth(current + step))
              else if (event.key === "ArrowRight")
                setWidth((current) => clampDetailWidth(current - step))
              else if (event.key === "Home") setWidth(MIN_DETAIL_WIDTH)
              else if (event.key === "End")
                setWidth(clampDetailWidth(window.innerWidth))
              else return
              event.preventDefault()
            }}
          >
            <Separator orientation="vertical" />
          </div>
        )}
        {finding && (
          <>
            <SheetHeader className="">
              <div className="mb-3 flex flex-wrap items-center gap-2 pr-7">
                <SeverityBadge
                  severity={finding.severity}
                  score={finding.cvss}
                />
                <StatusBadge status={finding.status} />
                <Badge variant="outline" className="max-w-full">
                  <span className="truncate" title={finding.id}>
                    {finding.id}
                  </span>
                </Badge>
                {finding.project && (
                  <Badge variant="outline">{finding.project}</Badge>
                )}
                <Badge variant="secondary">
                  {assetTypeLabels[finding.assetType]}
                </Badge>
                {finding.verified && (
                  <Badge variant="outline" className="">
                    <RiShieldCheckLine className="size-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <SheetTitle className="">{finding.title}</SheetTitle>
              <SheetDescription className="font-mono text-xs break-all">
                {finding.url || finding.host}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-0 min-h-0 flex-1">
              {finding.sourcePath && (
                <div className="space-y-1 p-4">
                  <div className="text-xs text-muted-foreground">
                    SOURCE FILE
                  </div>
                  <code className="text-xs break-all">
                    {finding.sourcePath}
                  </code>
                </div>
              )}
              {finding.assetType === "smart_contract" && (
                <div className="space-y-4 p-4">
                  <h3 className="font-semibold">Smart contract</h3>
                  <dl className="grid gap-3 text-sm [&_dd]:break-all [&_dt]:text-muted-foreground">
                    {[
                      ["Network", finding.chain],
                      ["Chain ID", finding.chainId],
                      ["Contract", finding.contractName],
                      ["Address", finding.contractAddress],
                      ["Function", finding.functionName],
                      [
                        "Source",
                        finding.sourceFile
                          ? `${finding.sourceFile}${finding.sourceLine !== null ? `:${finding.sourceLine}` : ""}`
                          : "",
                      ],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "Not provided"}</dd>
                      </div>
                    ))}
                  </dl>
                  <Separator />
                </div>
              )}
              <div className="space-y-4 p-4">
                <div className="text-xs font-medium text-muted-foreground">
                  SEVERITY ASSESSMENT
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold">
                    {finding.cvss?.toFixed(1) ?? "—"}
                  </span>
                  <div>
                    <strong className="text-sm uppercase">
                      {finding.severity}
                    </strong>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {finding.cvss !== null
                        ? "Reported CVSS score"
                        : "No CVSS score provided"}
                    </p>
                  </div>
                </div>
                {finding.vector && (
                  <code className="block text-xs break-all">
                    {finding.vector}
                  </code>
                )}
                <dl className="space-y-4 [&_dt]:mb-1 [&_dt]:text-muted-foreground">
                  {[
                    ["Impact", finding.impact],
                    ["Deliverability", finding.delivery],
                    ["Data exposure", finding.exposure],
                    ["Harm", finding.harm],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value || "Not provided in this record."}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <Separator />
              <div className="space-y-4 p-4">
                <div className="text-xs font-medium text-muted-foreground">
                  STEPS TO REPRODUCE
                </div>
                {finding.steps.length ? (
                  <ol className="list-decimal space-y-3 pl-5 [&_li>span]:hidden">
                    {finding.steps.map((step, i) => (
                      <li key={i}>
                        <span>{i + 1}</span>
                        <p>{step}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No reproduction steps provided.
                  </p>
                )}
              </div>
              <Separator />
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    PAYLOAD
                  </div>
                  {finding.payload && <CopyButton text={finding.payload} />}
                </div>
                <pre className="text-xs break-all whitespace-pre-wrap">
                  {finding.payload || "No payload provided."}
                </pre>
                <p className="mt-2 text-xs text-muted-foreground">
                  {finding.assetType === "smart_contract"
                    ? "Function: "
                    : finding.assetType === "web"
                      ? `${finding.method} · Parameter: `
                      : "Context: "}
                  <code>
                    {finding.functionName ||
                      finding.parameter ||
                      "Not provided"}
                  </code>
                </p>
              </div>
              <div className="space-y-4 p-4 pt-0">
                <div className="text-xs font-medium text-muted-foreground">
                  PROOF OF CONCEPT
                </div>
                {censored ? (
                  <p className="text-sm text-muted-foreground">***</p>
                ) : (
                  <EvidenceViewer
                    key={`${finding.id}:${finding.evidence.join("|")}`}
                    finding={finding}
                    copyButton={(text) => (
                      <CopyButton text={text} label="Copy content" />
                    )}
                  />
                )}
              </div>
              <Separator />
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    RAW RECORD
                  </div>
                  <CopyButton
                    text={JSON.stringify(finding.raw, null, 2)}
                    label="Copy JSON"
                  />
                </div>
                <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-80">
                  <pre className="text-xs break-all whitespace-pre-wrap">
                    {JSON.stringify(finding.raw, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </ScrollArea>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <span
                className="min-w-0 truncate font-mono text-xs text-muted-foreground"
                title={finding.id}
              >
                {finding.id}
              </span>
              <div className="flex flex-wrap gap-2">
                {censored && (
                  <p className="w-full text-xs text-muted-foreground">
                    Turn off censored mode to download original files.
                  </p>
                )}
                <ProjectDownload
                  key={`${finding.id}:${censored}`}
                  finding={finding}
                  disabled={censored}
                />
                <JsonDownload
                  value={finding.raw}
                  filename={`${finding.id}.json`}
                  disabled={censored}
                >
                  <RiDownloadLine />
                  Download record
                </JsonDownload>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
