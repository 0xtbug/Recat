import { useEffect, useState } from "react"
import {
  RiDashboardLine,
  RiFileSearchLine,
  RiRefreshLine,
  RiSunLine,
  RiMoonLine,
  RiSettings3Line,
  RiErrorWarningLine,
  RiLogoutBoxRLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"
import { Dashboard } from "@/components/dashboard"
import { FindingsTable } from "@/components/findings-table"
import { FindingDetail } from "@/components/finding-detail"
import { SourceSettings } from "@/components/source-settings"
import { useFolderSource } from "@/hooks/use-folder-source"
import type { Filters } from "@/lib/findings"
import { LoginPanel } from "@/components/login-panel"
import { Mascot } from "@/components/mascot"

function currentPage() {
  return location.hash === "#/findings"
    ? "findings"
    : location.hash === "#/settings"
      ? "settings"
      : "dashboard"
}
function WorkspaceSidebar({
  page,
  onNavigate,
  count,
}: {
  page: string
  onNavigate: (page: string) => void
  count: number
}) {
  const { setOpenMobile } = useSidebar()
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-1 px-1">
          <Mascot
            directions="/mascots/cybersec-orange-lens-directions.webp?v=level-gaze"
            reactions="/mascots/cybersec-orange-lens-reactions.webp?v=level-gaze"
            size={72}
            label="orange cybersecurity cat"
          />
          <SidebarMenu className="min-w-0 flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<a href="#/dashboard" />}
                aria-label="Recat dashboard"
                onClick={() => {
                  onNavigate("dashboard")
                  setOpenMobile(false)
                }}
              >
                <div className="grid gap-1 text-left">
                  <span className="font-semibold">Recat</span>
                  <span className="text-xs text-muted-foreground">
                    Hunting intelligence
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {[
              { key: "dashboard", label: "Dashboard", icon: RiDashboardLine },
              { key: "findings", label: "Findings", icon: RiFileSearchLine },
              { key: "settings", label: "Settings", icon: RiSettings3Line },
            ].map((n) => (
              <SidebarMenuItem key={n.key}>
                <SidebarMenuButton
                  render={<a href={`#/${n.key}`} />}
                  aria-current={page === n.key ? "page" : undefined}
                  isActive={page === n.key}
                  onClick={() => {
                    onNavigate(n.key)
                    setOpenMobile(false)
                  }}
                >
                  <n.icon />
                  <span>{n.label}</span>
                </SidebarMenuButton>
                {n.key === "findings" && (
                  <SidebarMenuBadge aria-label={`${count} findings`}>
                    {count}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs text-muted-foreground">
          <span>
            Built by{" "}
            <a
              href="https://github.com/0xtbug"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              0xtbug
            </a>
          </span>
          <span>v1.0.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [configured, setConfigured] = useState(true)
  const [sessionError, setSessionError] = useState("")
  useEffect(() => {
    const controller = new AbortController()
    void fetch("/api/session", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to connect to Recat.")
        const session = await response.json()
        setAuthenticated(session.authenticated === true)
        setConfigured(session.configured === true)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setSessionError(
            error instanceof Error
              ? error.message
              : "Unable to connect to Recat."
          )
          setAuthenticated(false)
        }
      })
    const expired = () => setAuthenticated(false)
    window.addEventListener("recat-session-expired", expired)
    return () => {
      controller.abort()
      window.removeEventListener("recat-session-expired", expired)
    }
  }, [])
  if (authenticated === null)
    return (
      <main className="grid min-h-svh place-items-center" role="status">
        Loading Recat…
      </main>
    )
  if (!authenticated)
    return (
      <>
        {sessionError && (
          <Alert variant="destructive">
            <AlertDescription>{sessionError}</AlertDescription>
          </Alert>
        )}
        <LoginPanel
          configured={configured}
          onLogin={() => {
            setSessionError("")
            setAuthenticated(true)
          }}
        />
      </>
    )
  return <WorkspaceApp onLogout={() => setAuthenticated(false)} />
}

function WorkspaceApp({ onLogout }: { onLogout: () => void }) {
  const [censored, setCensored] = useState(() => {
    try {
      return localStorage.getItem("recat-censored") === "true"
    } catch {
      return false
    }
  })
  function toggleCensored() {
    const next = !censored
    setCensored(next)
    try {
      localStorage.setItem("recat-censored", String(next))
    } catch {
      /* Preference still applies for this session. */
    }
  }
  const { snapshot, error, refreshing, refresh } = useFolderSource()
  const [page, setPage] = useState(currentPage)
  const [filters, setFilters] = useState<Filters>({ sort: "newest" })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")
  async function logout() {
    setLoggingOut(true)
    setLogoutError("")
    try {
      const response = await fetch("/api/logout", { method: "POST" })
      if (!response.ok) throw new Error("Unable to sign out. Try again.")
      onLogout()
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Unable to sign out."
      )
    } finally {
      setLoggingOut(false)
    }
  }
  const selected =
    snapshot.data.findings.find((f) => f.id === selectedId) || null
  useEffect(() => {
    const listener = () => setPage(currentPage())
    window.addEventListener("hashchange", listener)
    return () => window.removeEventListener("hashchange", listener)
  }, [])
  function navigate(next: string) {
    setPage(next)
    location.hash = `/${next}`
    setSelectedId(null)
  }
  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh min-h-0 overflow-hidden">
        <WorkspaceSidebar
          page={page}
          onNavigate={navigate}
          count={snapshot.data.findings.length}
        />
        <SidebarInset className="min-h-0 min-w-0">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4 self-center" />
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap">
                  <BreadcrumbItem className="hidden sm:inline-flex">
                    <BreadcrumbLink href="#/dashboard">
                      Workspace
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {page === "dashboard"
                        ? "Dashboard"
                        : page === "settings"
                          ? "Settings"
                          : "Findings"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div
                      className="flex h-9 items-center gap-2.5 px-1 outline-none focus-visible:ring-1 focus-visible:ring-ring sm:min-w-28 sm:px-2"
                      tabIndex={0}
                      aria-label={
                        error
                          ? "Source unavailable"
                          : refreshing
                            ? "Syncing source folder"
                            : "Source folder synced"
                      }
                    />
                  }
                >
                  {error ? (
                    <RiErrorWarningLine className="size-4 shrink-0 text-destructive" />
                  ) : refreshing ? (
                    <RiRefreshLine className="size-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full bg-emerald-600 ring-4 ring-emerald-600/10 dark:bg-emerald-400 dark:ring-emerald-400/10"
                    />
                  )}
                  <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                    <span
                      className={`text-[11px] leading-none font-medium ${error ? "text-destructive" : "text-foreground"}`}
                    >
                      {error
                        ? "Source unavailable"
                        : refreshing
                          ? "Syncing…"
                          : "Synced"}
                    </span>
                    {snapshot.scannedAt && !error ? (
                      <time
                        dateTime={snapshot.scannedAt}
                        className="text-[10px] leading-none whitespace-nowrap text-muted-foreground tabular-nums"
                      >
                        Updated{" "}
                        {new Date(snapshot.scannedAt).toLocaleTimeString(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        )}
                      </time>
                    ) : (
                      <span className="text-[10px] leading-none text-muted-foreground">
                        {error
                          ? "Check source settings"
                          : "Reading source folder"}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {error ||
                    (snapshot.scannedAt
                      ? `Folder checked at ${new Date(snapshot.scannedAt).toLocaleTimeString("en-GB")}. Auto-refresh every 5 seconds.`
                      : "Reading source folder…")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      className="h-9 w-9 gap-2 px-0 sm:w-28 sm:px-3"
                      aria-label="Refresh dataset"
                      disabled={refreshing}
                      onClick={() => {
                        void refresh()
                      }}
                    />
                  }
                >
                  <RiRefreshLine
                    className={
                      refreshing
                        ? "animate-spin motion-reduce:animate-none"
                        : ""
                    }
                  />
                  <span className="hidden sm:inline">
                    {refreshing ? "Refreshing" : "Refresh"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Read source folder now</TooltipContent>
              </Tooltip>
              <Separator
                orientation="vertical"
                className="mx-0.5 h-5 self-center"
              />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={
                        theme === "dark"
                          ? "Switch to light theme"
                          : "Switch to dark theme"
                      }
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                    />
                  }
                >
                  {theme === "dark" ? <RiSunLine /> : <RiMoonLine />}
                </TooltipTrigger>
                <TooltipContent>
                  {theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Sign out"
                      disabled={loggingOut}
                      onClick={() => void logout()}
                    />
                  }
                >
                  <RiLogoutBoxRLine />
                </TooltipTrigger>
                <TooltipContent>Sign out</TooltipContent>
              </Tooltip>
            </div>
          </header>
          <ScrollArea className="h-0 min-h-0 flex-1">
            <div className="space-y-4 p-4 md:p-6">
              {logoutError && (
                <Alert variant="destructive">
                  <AlertDescription>{logoutError}</AlertDescription>
                </Alert>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {censored && page === "findings" ? "***" : error} Check the
                    source folder in Settings.
                  </AlertDescription>
                </Alert>
              )}
              {snapshot.data.warnings.length > 0 && (
                <Alert>
                  <AlertDescription>
                    {snapshot.data.warnings.length} source warnings:{" "}
                    {censored && page === "findings"
                      ? "***"
                      : snapshot.data.warnings.slice(0, 3).join(" ")}
                  </AlertDescription>
                </Alert>
              )}
              {page === "settings" ? (
                <SourceSettings
                  key={snapshot.folder}
                  snapshot={snapshot}
                  onSaved={() => refresh()}
                />
              ) : page === "dashboard" ? (
                <Dashboard
                  data={snapshot.data}
                  onFinding={(f) => setSelectedId(f.id)}
                  onExplore={(type, severity) => {
                    setFilters({
                      type: type || "all",
                      severity: severity || "all",
                      sort: "newest",
                    })
                    navigate("findings")
                  }}
                />
              ) : (
                <FindingsTable
                  censored={censored}
                  onToggleCensored={toggleCensored}
                  findings={snapshot.data.findings}
                  filters={filters}
                  onFilters={setFilters}
                  onFinding={(f) => setSelectedId(f.id)}
                />
              )}
            </div>
          </ScrollArea>
        </SidebarInset>
        <FindingDetail
          finding={selected}
          censored={censored}
          onClose={() => setSelectedId(null)}
        />
      </SidebarProvider>
    </TooltipProvider>
  )
}
