import { useCallback, useEffect, useRef, useState } from "react"
import type { Dataset } from "@/lib/findings"

export type FolderSnapshot = {
  folder: string
  data: Dataset
  projects: string[]
  fileCount: number
  scannedAt: string | null
}
const empty: FolderSnapshot = {
  folder: "",
  data: { findings: [], targets: [], warnings: [] },
  projects: [],
  fileCount: 0,
  scannedAt: null,
}
export function useFolderSource() {
  const [snapshot, setSnapshot] = useState(empty)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(true)
  const request = useRef<AbortController | null>(null)
  const load = useCallback(() => {
    if (request.current) return Promise.resolve()
    const controller = new AbortController()
    request.current = controller
    return fetch("/api/source", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.dispatchEvent(new Event("recat-session-expired"))
          throw new Error("Your session has expired. Please sign in again.")
        }
        const result = await response.json()
        if (!response.ok)
          throw new Error(result.error || "Cannot read findings folder")
        if (!controller.signal.aborted) {
          setSnapshot(result)
          setError("")
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Cannot read findings folder"
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setRefreshing(false)
        if (request.current === controller) request.current = null
      })
  }, [])
  const refresh = useCallback(async () => {
    setRefreshing(true)
    await load()
  }, [load])
  useEffect(() => {
    void load()
    const timer = window.setInterval(() => {
      void load()
    }, 5000)
    return () => {
      window.clearInterval(timer)
      request.current?.abort()
      request.current = null
    }
  }, [load])
  return { snapshot, error, refreshing, refresh }
}
