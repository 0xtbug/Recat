import { Badge } from "@/components/ui/badge"
import type { Severity } from "@/lib/findings"

export function SeverityBadge({
  severity,
  score,
}: {
  severity: Severity
  score?: number | null
}) {
  return (
    <Badge
      variant={
        severity === "critical"
          ? "destructive"
          : severity === "high"
            ? "secondary"
            : "outline"
      }
    >
      {severity}
      {score != null && (
        <span className="ml-1 opacity-75">{score.toFixed(1)}</span>
      )}
    </Badge>
  )
}
