import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { FolderSource } from "./server/folder-source.ts"
import { folderApi } from "./server/api.ts"

const source = new FolderSource(path.resolve(import.meta.dirname, ".."))
const middleware = folderApi(source)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "recat-folder-source",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          void middleware(req, res, next)
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          void middleware(req, res, next)
        })
      },
    },
  ],
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1" },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
