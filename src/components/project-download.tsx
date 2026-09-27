import { RiDownloadLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import type { Finding } from "@/lib/findings"

export function ProjectDownload({
  finding,
  disabled = false,
}: {
  finding: Finding
  disabled?: boolean
}) {
  const href = `/api/project-zip?${new URLSearchParams({ finding: finding.id })}`
  return (
    <Button
      variant="outline"
      disabled={disabled}
      nativeButton={false}
      render={
        <a
          href={disabled ? undefined : href}
          download={
            disabled ? undefined : `${finding.project || "project"}.zip`
          }
        />
      }
    >
      <RiDownloadLine />
      Download folder ZIP
    </Button>
  )
}
