import { expect, test } from "bun:test"
import { createServer } from "node:http"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { tmpdir } from "node:os"
import { FolderSource } from "../server/folder-source"
import { folderApi } from "../server/api"
import { unzipSync, strFromU8 } from "fflate"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ProjectDownload } from "../src/components/project-download"

test("HTTP settings persists a valid folder, source returns real findings, cross-origin writes are rejected", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "recat-api-"))
  const folder = path.join(root, "records/project")
  await mkdir(folder, { recursive: true })
  await writeFile(
    path.join(folder, "finding.json"),
    JSON.stringify({ title: "API fixture", evidence: ["proof.md"] })
  )
  await writeFile(
    path.join(folder, "proof.md"),
    "# API proof\n\nMarkdown content."
  )
  await mkdir(path.join(folder, "evidence"))
  await writeFile(
    path.join(folder, "evidence/proof.bin"),
    new Uint8Array([0, 255, 42])
  )
  const handler = folderApi(new FolderSource(root), {
    password: "test-only-password",
  })
  const server = createServer((req, res) => {
    void handler(req, res, () => {
      res.writeHead(404)
      res.end()
    })
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string")
    throw new Error("No server address")
  const base = `http://127.0.0.1:${address.port}`
  let sessionCookie = ""
  const fetch = (input: string, init: RequestInit = {}) =>
    globalThis.fetch(input, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init.headers)),
        Cookie: sessionCookie,
      },
    })
  try {
    for (const endpoint of [
      "/api/source",
      "/api/evidence",
      "/api/project-zip",
      "/api/settings",
    ]) {
      expect((await fetch(base + endpoint)).status).toBe(401)
    }
    const wrong = await fetch(base + "/api/login", {
      method: "POST",
      body: JSON.stringify({ password: "incorrect" }),
    })
    expect(wrong.status).toBe(401)
    const login = await fetch(base + "/api/login", {
      method: "POST",
      body: JSON.stringify({ password: "test-only-password" }),
    })
    expect(login.status).toBe(200)
    const cookie = login.headers.get("set-cookie") || ""
    expect(cookie).toContain("HttpOnly")
    expect(cookie).toContain("SameSite=Strict")
    sessionCookie = cookie.split(";")[0]
    expect(
      (await (await fetch(base + "/api/session")).json()).authenticated
    ).toBe(true)
    const save = await fetch(base + "/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: path.dirname(folder) }),
    })
    expect(save.status).toBe(200)
    const response = await fetch(base + "/api/source")
    const snapshot = await response.json()
    expect(snapshot.data.findings[0].title).toBe("API fixture")
    expect(snapshot.projects).toEqual(["project"])
    const evidence = await fetch(
      base +
        "/api/evidence?" +
        new URLSearchParams({
          finding: snapshot.data.findings[0].id,
          file: "proof.md",
        })
    )
    expect(evidence.status).toBe(200)
    expect((await evidence.json()).content).toBe(
      "# API proof\n\nMarkdown content."
    )
    const downloadMarkup = renderToStaticMarkup(
      createElement(ProjectDownload, { finding: snapshot.data.findings[0] })
    )
    const downloadHref = downloadMarkup.match(/href="([^"]+)"/)?.[1]
    expect(downloadHref).toBe(
      `/api/project-zip?${new URLSearchParams({ finding: snapshot.data.findings[0].id })}`
    )
    expect(downloadMarkup).toContain('download="project.zip"')
    const disabledMarkup = renderToStaticMarkup(
      createElement(ProjectDownload, {
        finding: snapshot.data.findings[0],
        disabled: true,
      })
    )
    expect(disabledMarkup).not.toContain('href="')
    expect(disabledMarkup).not.toContain('download="')
    const zipUrl = new URL(downloadHref!, base).href
    const archive = await fetch(zipUrl)
    expect(archive.status).toBe(200)
    expect(archive.headers.get("content-type")).toBe("application/zip")
    expect(archive.headers.get("content-disposition")).toContain("project.zip")
    const files = unzipSync(new Uint8Array(await archive.arrayBuffer()))
    expect(strFromU8(files["project/proof.md"])).toContain("# API proof")
    expect(files["project/evidence/proof.bin"]).toEqual(
      new Uint8Array([0, 255, 42])
    )
    expect(files["project/finding.json"]).toBeDefined()
    expect(
      (await fetch(base + "/api/project-zip?finding=missing")).status
    ).toBe(404)
    expect(
      (await fetch(zipUrl, { headers: { Origin: "https://unrelated.test" } }))
        .status
    ).toBe(403)
    const rejected = await fetch(base + "/api/settings", {
      method: "PUT",
      headers: { Origin: "https://unrelated.test" },
      body: JSON.stringify({ folder }),
    })
    expect(rejected.status).toBe(403)
    const invalid = await fetch(base + "/api/settings", {
      method: "PUT",
      body: JSON.stringify({ folder: "missing" }),
    })
    expect(invalid.status).toBe(400)
    expect((await (await fetch(base + "/api/source")).json()).folder).toBe(
      path.dirname(folder)
    )
    expect((await fetch(base + "/api/logout", { method: "POST" })).status).toBe(
      200
    )
    expect((await fetch(base + "/api/source")).status).toBe(401)
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
    await rm(root, { recursive: true, force: true })
  }
})
