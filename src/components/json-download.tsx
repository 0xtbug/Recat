import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function JsonDownload({
  value,
  filename,
  children,
  disabled = false,
  className,
}: {
  value: unknown
  filename: string
  children: ReactNode
  disabled?: boolean
  className?: string
}) {
  if (disabled)
    return (
      <Button variant="outline" disabled className={className}>
        {children}
      </Button>
    )
  const href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(value, null, 2))}`
  return (
    <Button
      nativeButton={false}
      variant="outline"
      className={className}
      render={<a href={href} download={filename} />}
    >
      {children}
    </Button>
  )
}
