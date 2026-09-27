import { useState } from "react"
import { RiCheckLine, RiFileCopyLine, RiDownloadLine } from "@remixicon/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { agentPrompt, agentInstallation } from "@/lib/agent-integration"

export function AgentIntegration({ folder }: { folder: string }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const text = agentPrompt(folder)
  const href = `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`
  async function copy() {
    setError("")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError("Unable to copy. Select the text and copy it manually.")
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent integration</CardTitle>
        <CardDescription>
          One SKILL.md for Codex, Claude Code, or Hermes, including web, smart
          contract, and Other JSON examples.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">SKILL.md</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? <RiCheckLine /> : <RiFileCopyLine />}
              {copied ? "Copied" : "Copy SKILL.md"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={href} download="SKILL.md" />}
            >
              <RiDownloadLine />
              Download SKILL.md
            </Button>
          </div>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {agentInstallation}
        </p>
        <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-96">
          <pre className="text-xs break-words whitespace-pre-wrap">{text}</pre>
        </ScrollArea>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Findings go in &lt;project&gt;/bug/&lt;name_poc&gt;/ with README.md,
          PASTE_EMAIL_READY.md, poc/ artifacts, and smart contract tests in
          test/. Examples use fictional targets. An agent on another machine
          needs a shared or synchronized source folder.
        </p>
      </CardContent>
    </Card>
  )
}
