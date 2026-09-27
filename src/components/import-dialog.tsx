import { useRef, useState, type DragEvent } from "react"
import {
  RiUploadCloud2Line,
  RiFileCodeLine,
  RiArrowRightLine,
  RiInformationLine,
} from "@remixicon/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { normalizeDataset, type Dataset } from "@/lib/findings"

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: Dataset, filename: string, original: unknown) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<{
    data: Dataset
    name: string
    original: unknown
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  async function read(file?: File) {
    if (!file) return
    setError("")
    setPreview(null)
    if (file.size > 10 * 1024 * 1024) {
      setError("This file is too large. Choose a JSON file under 10 MB.")
      return
    }
    try {
      const original: unknown = JSON.parse(await file.text())
      const data = normalizeDataset(original)
      setPreview({ data, name: file.name, original })
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "Invalid JSON. Check the file syntax and try again."
          : e instanceof Error
            ? e.message
            : "Could not read this file."
      )
    }
  }
  function drop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    void read(e.dataTransfer.files[0])
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-[calc(100svh-6rem)]">
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <div className="">
                <RiUploadCloud2Line />
              </div>
              <DialogTitle className="text-xl">
                Bring your findings in
              </DialogTitle>
              <DialogDescription>
                Import JSON output from your Hermes hunting agent.
              </DialogDescription>
            </DialogHeader>
            <Input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Choose findings JSON"
              onChange={(e) => {
                void read(e.target.files?.[0])
                e.target.value = ""
              }}
            />
            <Button
              variant={dragging ? "secondary" : "outline"}
              className="flex h-36 w-full flex-col gap-2"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}
            >
              <RiFileCodeLine className="size-8" />
              <strong>
                {preview ? preview.name : "Click to upload or drag a file here"}
              </strong>
              <span>JSON files up to 10 MB</span>
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {preview && (
              <Alert className="">
                <RiInformationLine />
                <AlertDescription>
                  <strong>
                    {preview.data.findings.length} findings ready to import
                  </strong>
                  <span>
                    {preview.data.targets.length} targets with coverage data
                  </span>
                  {preview.data.warnings.slice(0, 5).map((w, i) => (
                    <span key={i} className="text-amber-700">
                      {w}
                    </span>
                  ))}
                  {preview.data.warnings.length > 5 && (
                    <span className="text-amber-700">
                      {preview.data.warnings.length - 5} additional warnings.
                      Invalid records will be skipped.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                Accepts a finding, an array, or{" "}
                <code>{'{ "findings": [...] }'}</code>.
              </p>
              <p>
                Import replaces the current dataset and saves it in this
                browser.
              </p>
              <a href="/recat-sample.json" download>
                Download sample JSON{" "}
                <RiArrowRightLine className="inline size-3" />
              </a>
            </div>
            <Button
              className=""
              disabled={!preview}
              onClick={() => {
                if (preview) {
                  onImport(preview.data, preview.name, preview.original)
                  onOpenChange(false)
                  setPreview(null)
                  setError("")
                }
              }}
            >
              Import findings
              <RiArrowRightLine />
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
