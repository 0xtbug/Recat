import {
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { zipSync, type Zippable } from "fflate"
import { normalizeDataset, type Dataset } from "../src/lib/findings.ts"

function fileKey(filename: string) {
  return process.platform === "win32" ? filename.toLowerCase() : filename
}

export class FolderSource {
  readonly configFile: string
  readonly root: string
  constructor(root: string) {
    this.root = root
    this.configFile = path.join(root, ".recat/settings.json")
  }
  async folder() {
    try {
      const settings = JSON.parse(await readFile(this.configFile, "utf8"))
      if (typeof settings.folder !== "string" || !settings.folder.trim())
        throw new Error("Invalid folder settings")
      return path.resolve(this.root, settings.folder)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return path.join(this.root, "finding/source")
      throw error
    }
  }
  async saveFolder(input: string) {
    if (!input.trim() || input.includes("\0"))
      throw new Error("Enter a valid folder path")
    const folder = path.resolve(this.root, input.trim())
    if (!(await stat(folder)).isDirectory())
      throw new Error("The path must be a directory")
    await readdir(folder)
    await mkdir(path.dirname(this.configFile), { recursive: true })
    const temporary = `${this.configFile}.tmp`
    await writeFile(temporary, JSON.stringify({ folder }, null, 2))
    await rename(temporary, this.configFile)
    return folder
  }
  async readEvidence(findingId: string, filename: string) {
    const snapshot = await this.scan()
    const finding = snapshot.data.findings.find(
      (finding) => finding.id === findingId
    )
    if (!finding || !finding.evidence.includes(filename))
      throw new Error("Evidence file is not listed for this finding")
    const projectRoot = path.join(
      snapshot.folder,
      finding.sourcePath.includes("/") ? finding.sourcePath.split("/")[0] : ""
    )
    const base = await realpath(projectRoot)
    const candidate = path.resolve(
      path.dirname(path.join(snapshot.folder, finding.sourcePath)),
      filename
    )
    const resolved = await realpath(candidate)
    const relative = path.relative(base, resolved)
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
      throw new Error("Evidence must stay inside its project folder")
    const info = await stat(resolved)
    if (!info.isFile()) throw new Error("Evidence must be a file")
    if (info.size > 2 * 1024 * 1024)
      throw new Error("Evidence file exceeds 2 MB")
    const extension = path.extname(resolved).toLowerCase()
    if (
      ![
        ".md",
        ".markdown",
        ".txt",
        ".json",
        ".html",
        ".htm",
        ".sol",
        ".log",
        ".csv",
        ".yaml",
        ".yml",
      ].includes(extension)
    )
      throw new Error("This evidence format cannot be displayed as text")
    const content = await readFile(resolved, "utf8")
    return {
      filename,
      content,
      format: [".md", ".markdown"].includes(extension) ? "markdown" : "text",
    }
  }
  async downloadProject(findingId: string) {
    const snapshot = await this.scan()
    const finding = snapshot.data.findings.find((item) => item.id === findingId)
    if (!finding) throw new Error("Finding not found")
    const root = await realpath(snapshot.folder)
    const project = await realpath(
      path.join(
        root,
        finding.sourcePath.includes("/") ? finding.sourcePath.split("/")[0] : ""
      )
    )
    const relative = path.relative(root, project)
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
      throw new Error("Project must stay inside the source folder")
    const name = path.basename(project)
    const files: Zippable = {}
    let totalBytes = 0
    let fileCount = 0
    async function collect(directory: string) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name)
        if (entry.isDirectory()) {
          const key = `${name}/${path.relative(project, filename).split(path.sep).join("/")}/`
          files[key] = new Uint8Array()
          await collect(filename)
        } else if (entry.isFile()) {
          const info = await stat(filename)
          totalBytes += info.size
          if (++fileCount > 10000 || totalBytes > 100 * 1024 * 1024)
            throw new Error("Project archive exceeds 100 MB or 10,000 files")
          const content = await readFile(filename)
          totalBytes += content.byteLength - info.size
          if (totalBytes > 100 * 1024 * 1024)
            throw new Error("Project archive exceeds 100 MB")
          files[
            `${name}/${path.relative(project, filename).split(path.sep).join("/")}`
          ] = content
        }
      }
    }
    await collect(project)
    return { filename: `${name}.zip`, content: zipSync(files) }
  }
  async scan() {
    const folder = await this.folder()
    const data: Dataset = { findings: [], targets: [], warnings: [] }
    const projects = new Set<string>()
    const targetIndices = new Map<string, number>()
    const evidenceFiles = new Set<string>()
    const pending: (() => void)[] = []
    let fileCount = 0
    async function visit(directory: string) {
      let entries
      try {
        entries = await readdir(directory, { withFileTypes: true })
      } catch (error) {
        data.warnings.push(
          `Cannot read folder ${directory}: ${(error as NodeJS.ErrnoException).code || "read error"}`
        )
        return
      }
      entries.sort((a, b) => a.name.localeCompare(b.name))
      for (const entry of entries) {
        const filename = path.join(directory, entry.name)
        if (entry.isDirectory()) {
          await visit(filename)
          continue
        }
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".json"))
          continue
        const sourcePath = path
          .relative(folder, filename)
          .split(path.sep)
          .join("/")
        try {
          if ((await stat(filename)).size > 10 * 1024 * 1024)
            throw new Error("JSON file exceeds 10 MB")
          const imported = normalizeDataset(
            JSON.parse(await readFile(filename, "utf8"))
          )
          for (const finding of imported.findings) {
            const projectRoot = path.join(
              folder,
              sourcePath.includes("/") ? sourcePath.split("/")[0] : ""
            )
            for (const evidence of finding.evidence) {
              const candidate = path.resolve(path.dirname(filename), evidence)
              const relative = path.relative(projectRoot, candidate)
              if (
                relative === ".." ||
                relative.startsWith(`..${path.sep}`) ||
                path.isAbsolute(relative)
              ) {
                imported.warnings.push(
                  `Evidence outside project folder: ${evidence}`
                )
                continue
              }
              if (fileKey(candidate) !== fileKey(filename))
                evidenceFiles.add(fileKey(candidate))
            }
          }
          pending.push(() => {
            if (evidenceFiles.has(fileKey(filename))) return
            fileCount++
            const project = sourcePath.includes("/")
              ? sourcePath.split("/")[0]
              : path.basename(folder)
            projects.add(project)
            for (const finding of imported.findings) {
              data.findings.push({
                ...finding,
                id: `${sourcePath}:${finding.id}`,
                project,
                sourcePath,
                raw: finding.raw,
              })
            }
            for (const target of imported.targets) {
              const index = targetIndices.get(target.host)
              if (index === undefined) {
                targetIndices.set(target.host, data.targets.length)
                data.targets.push(target)
              } else {
                const previous = data.targets[index]
                const currentDate = target.lastScan
                  ? Date.parse(target.lastScan)
                  : -Infinity
                const previousDate = previous.lastScan
                  ? Date.parse(previous.lastScan)
                  : -Infinity
                const latest = currentDate > previousDate ? target : previous
                const other = latest === target ? previous : target
                data.targets[index] = {
                  ...latest,
                  subdomains: latest.subdomains ?? other.subdomains,
                  endpoints: latest.endpoints ?? other.endpoints,
                }
                if (
                  currentDate === previousDate &&
                  ((target.subdomains !== null &&
                    previous.subdomains !== null &&
                    target.subdomains !== previous.subdomains) ||
                    (target.endpoints !== null &&
                      previous.endpoints !== null &&
                      target.endpoints !== previous.endpoints))
                ) {
                  data.warnings.push(
                    `${sourcePath}: conflicting coverage for ${target.host}; kept the first report because scan times match or are missing.`
                  )
                }
              }
            }
            data.warnings.push(
              ...imported.warnings.map((w) => `${sourcePath}: ${w}`)
            )
          })
        } catch (error) {
          pending.push(() => {
            if (evidenceFiles.has(fileKey(filename))) return
            data.warnings.push(
              `${sourcePath}: ${error instanceof Error ? error.message : "Cannot read JSON"}`
            )
          })
        }
      }
    }
    await visit(folder)
    for (const apply of pending) apply()
    return {
      folder,
      data,
      projects: [...projects].sort(),
      fileCount,
      scannedAt: new Date().toISOString(),
      pollInterval: 5000,
    }
  }
}
