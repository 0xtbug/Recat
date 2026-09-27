import { lazy, Suspense, useRef, useState, type ReactNode } from "react"
import { RiFileCodeLine, RiFileTextLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Finding } from "@/lib/findings"
const Markdown = lazy(() => import("react-markdown"))

type Evidence = {
  filename: string
  content: string
  format: "markdown" | "text"
}
export function EvidenceViewer({
  finding,
  copyButton,
}: {
  finding: Finding
  copyButton: (text: string) => ReactNode
}) {
  const [selected, setSelected] = useState("")
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState("preview")
  const request = useRef(0)
  async function select(filename: string) {
    const id = ++request.current
    setSelected(filename)
    setEvidence(null)
    setError("")
    setLoading(true)
    setView("preview")
    try {
      const response = await fetch(
        `/api/evidence?${new URLSearchParams({ finding: finding.id, file: filename })}`
      )
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || "Could not read this file")
      if (id === request.current) setEvidence(result)
    } catch (error) {
      if (id === request.current)
        setError(
          error instanceof Error ? error.message : "Could not read this file"
        )
    } finally {
      if (id === request.current) setLoading(false)
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {finding.evidence.map((name, i) => (
          <Button
            key={`${name}-${i}`}
            variant={selected === name ? "default" : "outline"}
            size="sm"
            className="h-auto max-w-full py-2"
            onClick={() => {
              void select(name)
            }}
            aria-pressed={selected === name}
          >
            {name.endsWith(".json") || name.endsWith(".html") ? (
              <RiFileCodeLine />
            ) : (
              <RiFileTextLine />
            )}
            <span className="min-w-0 truncate" title={name}>
              {name}
            </span>
          </Button>
        ))}
      </div>
      {!finding.evidence.length ? (
        <p className="text-sm text-muted-foreground">
          No evidence files listed.
        </p>
      ) : (
        !selected && (
          <p className="text-xs text-muted-foreground">
            Select a file to read its contents.
          </p>
        )
      )}
      {loading && (
        <p role="status" className="text-xs text-muted-foreground">
          Reading {selected}…
        </p>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {evidence && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="min-w-0 break-all">
                {evidence.filename}
              </CardTitle>
              {copyButton(evidence.content)}
            </div>
            {evidence.format === "markdown" && (
              <div className="flex gap-2">
                <Button
                  variant={view === "preview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("preview")}
                >
                  Markdown
                </Button>
                <Button
                  variant={view === "source" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("source")}
                >
                  Source
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-80">
              <div className="text-sm break-words [&_a]:underline [&_blockquote]:border-l [&_blockquote]:pl-3 [&_code]:text-xs [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-2 [&_h3]:font-semibold [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_pre]:break-all [&_pre]:whitespace-pre-wrap [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
                {evidence.format === "markdown" && view === "preview" ? (
                  <Suspense
                    fallback={
                      <p className="text-xs text-muted-foreground">
                        Loading Markdown…
                      </p>
                    }
                  >
                    <Markdown
                      skipHtml
                      components={{
                        img: ({ alt }) => <span>{alt || "Image"}</span>,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {evidence.content}
                    </Markdown>
                  </Suspense>
                ) : (
                  <pre className="text-xs break-all whitespace-pre-wrap">
                    {evidence.content}
                  </pre>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
