import { useState, type FormEvent } from "react"
import { RiFolderLine } from "@remixicon/react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { FolderSnapshot } from "@/hooks/use-folder-source"
import { AgentIntegration } from "./agent-integration"

export function SourceSettings({
  snapshot,
  onSaved,
}: {
  snapshot: FolderSnapshot
  onSaved: () => Promise<void>
}) {
  const [folder, setFolder] = useState(snapshot.folder)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Cannot save folder")
      setFolder(result.folder)
      await onSaved()
      setMessage(
        "Folder saved. Findings refresh automatically every 5 seconds."
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : "Cannot save folder")
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Source folder</CardTitle>
          <CardDescription>
            Read JSON findings from all project folders automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-folder">Folder path</Label>
              <Input
                id="source-folder"
                placeholder="finding/source"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                required
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Use an absolute path, or a path relative to the Recat root. Each
                project can have its own subfolder.
              </p>
            </div>
            <Button type="submit" disabled={saving || !folder.trim()}>
              <RiFolderLine />
              {saving ? "Saving…" : "Save folder"}
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Folder synchronization</CardTitle>
          <CardDescription>
            Added, edited, and removed JSON files appear on the next refresh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="space-y-3 text-sm [&_dd]:break-all [&_dt]:text-muted-foreground">
            <div>
              <dt>Active folder</dt>
              <dd>{snapshot.folder || "Loading…"}</dd>
            </div>
            <div>
              <dt>JSON files loaded</dt>
              <dd>{snapshot.fileCount}</dd>
            </div>
            <div>
              <dt>Projects</dt>
              <dd>{snapshot.projects.length}</dd>
            </div>
            <div>
              <dt>Last read</dt>
              <dd>
                {snapshot.scannedAt
                  ? new Date(snapshot.scannedAt).toLocaleString()
                  : "Not read yet"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {snapshot.projects.map((project) => (
              <Badge key={project} variant="outline">
                {project}
              </Badge>
            ))}
          </div>
          <pre className="text-xs whitespace-pre-wrap">
            {
              "finding/source/\n  examplemy.com/bug/<name_poc>/\n    finding.json\n    README.md\n    PASTE_EMAIL_READY.md\n    poc/\n    test/  # smart contract tests"
            }
          </pre>
          <p className="text-xs text-muted-foreground">
            Accepts a finding with a title, an array of findings, or an object
            with a findings array. Web, smart contract, and Other findings are
            supported.
          </p>
        </CardContent>
      </Card>
      <AgentIntegration folder={snapshot.folder} />
    </div>
  )
}
