import type { IncomingMessage, ServerResponse } from "node:http"
import { FolderSource } from "./folder-source.ts"
import { PasswordAuth, readLoginPassword } from "./auth.ts"

export function folderApi(
  source: FolderSource,
  options: { password?: string } = {}
) {
  const auth = new PasswordAuth(options.password ?? readLoginPassword())
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ) => {
    const pathname = req.url?.split("?")[0]
    if (
      pathname !== "/api/source" &&
      pathname !== "/api/settings" &&
      pathname !== "/api/evidence" &&
      pathname !== "/api/project-zip" &&
      pathname !== "/api/session" &&
      pathname !== "/api/login" &&
      pathname !== "/api/logout"
    )
      return next()
    const send = (status: number, value: unknown) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      })
      res.end(JSON.stringify(value))
    }
    try {
      const host = new URL(`http://${req.headers.host}`).hostname
      if (!["127.0.0.1", "localhost", "[::1]"].includes(host))
        return send(403, { error: "Folder API is available on localhost only" })
      if (
        req.headers.origin &&
        new URL(req.headers.origin).host !== req.headers.host
      )
        return send(403, { error: "Same-origin requests required" })
      if (pathname === "/api/session" && req.method === "GET")
        return send(200, {
          authenticated: auth.authenticated(req),
          configured: auth.configured,
        })
      if (pathname === "/api/login" && req.method === "POST") {
        let body = ""
        for await (const chunk of req) {
          body += chunk.toString()
          if (Buffer.byteLength(body) > 8192)
            return send(413, { error: "Login request is too large" })
        }
        let input
        try {
          input = JSON.parse(body)
        } catch {
          return send(400, { error: "Invalid login request" })
        }
        const status = auth.login(req, res, input?.password)
        if (status === 200) return send(200, { authenticated: true })
        if (status === 429) {
          res.setHeader("Retry-After", "900")
          return send(429, {
            error: "Too many attempts. Try again in 15 minutes.",
          })
        }
        return send(status, {
          error:
            status === 503
              ? "Set RECAT_PASSWORD in the server .env and restart Recat."
              : "Incorrect password.",
        })
      }
      if (pathname === "/api/logout" && req.method === "POST") {
        auth.logout(req, res)
        return send(200, { authenticated: false })
      }
      if (
        ["/api/login", "/api/logout", "/api/session"].includes(pathname || "")
      )
        return send(405, { error: "Method not allowed" })
      if (!auth.authenticated(req))
        return send(401, { error: "Login required" })
      if (pathname === "/api/source" && req.method === "GET")
        return send(200, await source.scan())
      if (pathname === "/api/project-zip" && req.method === "GET") {
        const finding =
          new URL(req.url || "/", "http://localhost").searchParams.get(
            "finding"
          ) || ""
        const archive = await source.downloadProject(finding)
        res.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="project.zip"; filename*=UTF-8''${encodeURIComponent(archive.filename)}`,
          "Cache-Control": "no-store",
          "Content-Length": archive.content.byteLength,
        })
        return res.end(archive.content)
      }
      if (pathname === "/api/evidence" && req.method === "GET") {
        const parameters = new URL(req.url || "/", "http://localhost")
          .searchParams
        return send(
          200,
          await source.readEvidence(
            parameters.get("finding") || "",
            parameters.get("file") || ""
          )
        )
      }
      if (pathname === "/api/settings" && req.method === "PUT") {
        let body = ""
        for await (const chunk of req) {
          body += chunk.toString()
          if (Buffer.byteLength(body) > 8192)
            throw new Error("Settings request is too large")
        }
        const settings = JSON.parse(body)
        if (typeof settings.folder !== "string")
          throw new Error("Folder must be a string")
        return send(200, { folder: await source.saveFolder(settings.folder) })
      }
      return send(405, { error: "Method not allowed" })
    } catch (error) {
      return send(
        pathname === "/api/evidence" || pathname === "/api/project-zip"
          ? 404
          : req.method === "PUT"
            ? 400
            : 500,
        {
          error:
            error instanceof Error ? error.message : "Folder source failed",
        }
      )
    }
  }
}
