import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import { parse } from "dotenv"

export function readLoginPassword() {
  if (process.env.RECAT_PASSWORD !== undefined)
    return process.env.RECAT_PASSWORD
  try {
    return (
      parse(readFileSync(path.resolve(import.meta.dirname, "../.env")))
        .RECAT_PASSWORD || ""
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return ""
    throw error
  }
}

const lifetime = 8 * 60 * 60 * 1000
const cookieName = "recat_session"
export class PasswordAuth {
  private readonly passwordHash: Buffer
  private readonly now: () => number
  readonly configured: boolean
  private readonly sessions = new Map<string, number>()
  private readonly attempts = new Map<
    string,
    { count: number; until: number }
  >()
  constructor(password: string, now = Date.now) {
    this.now = now
    this.configured = password.length > 0
    this.passwordHash = createHash("sha256").update(password).digest()
  }
  private token(req: IncomingMessage) {
    return (
      req.headers.cookie
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${cookieName}=`))
        ?.slice(cookieName.length + 1) || ""
    )
  }
  authenticated(req: IncomingMessage) {
    const token = this.token(req)
    const expires = this.sessions.get(token)
    if (!expires || expires <= this.now()) {
      this.sessions.delete(token)
      return false
    }
    return true
  }
  private cookie(res: ServerResponse, token: string, maxAge: number) {
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
    )
  }
  login(req: IncomingMessage, res: ServerResponse, password: unknown) {
    if (!this.configured) return 503
    const now = this.now()
    for (const [token, expires] of this.sessions)
      if (expires <= now) this.sessions.delete(token)
    for (const [ip, value] of this.attempts)
      if (value.until <= now) this.attempts.delete(ip)
    const ip = req.socket.remoteAddress || "local"
    const failures = this.attempts.get(ip)
    if (failures && failures.count >= 5) return 429
    const valid =
      typeof password === "string" &&
      password.length <= 1024 &&
      timingSafeEqual(
        createHash("sha256").update(password).digest(),
        this.passwordHash
      )
    if (!valid) {
      if (!failures && this.attempts.size >= 1000)
        this.attempts.delete(this.attempts.keys().next().value!)
      this.attempts.set(ip, {
        count: (failures?.count || 0) + 1,
        until: failures?.until || now + 15 * 60 * 1000,
      })
      return 401
    }
    this.attempts.delete(ip)
    this.sessions.delete(this.token(req))
    if (this.sessions.size >= 1000)
      this.sessions.delete(this.sessions.keys().next().value!)
    const token = randomBytes(32).toString("hex")
    this.sessions.set(token, now + lifetime)
    this.cookie(res, token, lifetime / 1000)
    return 200
  }
  logout(req: IncomingMessage, res: ServerResponse) {
    this.sessions.delete(this.token(req))
    this.cookie(res, "", 0)
  }
}
