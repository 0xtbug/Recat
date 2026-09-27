import {
  RiShieldCheckLine,
  RiTimeLine,
  RiCloseCircleLine,
} from "@remixicon/react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { statusInfo, type FindingStatus } from "@/lib/findings"

export function StatusBadge({ status }: { status: FindingStatus }) {
  const Icon =
    status === "confirmed"
      ? RiShieldCheckLine
      : status === "false_positive"
        ? RiCloseCircleLine
        : RiTimeLine
  return (
    <Tooltip>
      <TooltipTrigger render={<Badge variant="outline" tabIndex={0} />}>
        <Icon />
        {statusInfo[status].label}
      </TooltipTrigger>
      <TooltipContent>{statusInfo[status].description}</TooltipContent>
    </Tooltip>
  )
}
