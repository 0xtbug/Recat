import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { folderApi } from "./api.ts"
import { FolderSource } from "./folder-source.ts"

const root = path.resolve(import.meta.dirname, "../..")
const dist = path.resolve(import.meta.dirname, "../dist")
const api = folderApi(new FolderSource(root))
const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
}
createServer((req, res) => {
  void api(req, res, () => {
    void (async () => {
      try {
        const pathname = decodeURIComponent(
          new URL(req.url || "/", "http://localhost").pathname
        )
        const filename = path.resolve(
          dist,
          `.${pathname === "/" ? "/index.html" : pathname}`
        )
        if (!filename.startsWith(dist + path.sep)) {
          res.writeHead(404)
          res.end()
          return
        }
        const content = await readFile(filename)
        res.writeHead(200, {
          "Content-Type":
            types[path.extname(filename)] || "application/octet-stream",
        })
        res.end(content)
      } catch {
        res.writeHead(404)
        res.end("Not found")
      }
    })()
  })
}).listen(Number(process.env.PORT || 5173), "127.0.0.1", () => {
  process.stdout.write(`Recat: http://127.0.0.1:${process.env.PORT || 5173}\n`)
})
