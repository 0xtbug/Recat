import { useState, type FormEvent } from "react"
import { RiEyeLine, RiEyeOffLine, RiLoader4Line } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mascot } from "@/components/mascot"

export function LoginPanel({
  configured,
  onLogin,
}: {
  configured: boolean
  onLogin: () => void
}) {
  const [password, setPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Unable to sign in.")
      setPassword("")
      onLogin()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <ScrollArea className="h-svh">
      <main className="grid min-h-svh place-items-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mascot
                directions="/mascots/cybersec-orange-lens-directions.webp?v=level-gaze"
                reactions="/mascots/cybersec-orange-lens-reactions.webp?v=level-gaze"
                size={96}
                label="orange cybersecurity cat"
                sleeping={visible}
              />
              <div className="min-w-0 space-y-1">
                <CardTitle>Sign in to Recat</CardTitle>
                <CardDescription>
                  Enter your password to access your hunting workspace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => void submit(event)}
            >
              {!configured && (
                <Alert>
                  <AlertDescription>
                    Set RECAT_PASSWORD in the server .env file and restart Recat
                    to enable login.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <InputGroup>
                  <InputGroupInput
                    id="login-password"
                    type={visible ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={1024}
                    autoFocus
                    disabled={loading || !configured}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? "login-error" : undefined}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      aria-label={visible ? "Hide password" : "Show password"}
                      aria-pressed={visible}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <RiEyeOffLine /> : <RiEyeLine />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              {error && (
                <Alert variant="destructive" id="login-error" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !configured || !password}
              >
                {loading && <RiLoader4Line className="animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </ScrollArea>
  )
}
