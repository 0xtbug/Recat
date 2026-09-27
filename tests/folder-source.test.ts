import { afterEach, expect, test } from "bun:test"
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { platform } from "node:process"
import { FolderSource } from "../server/folder-source"
import { selectFindings } from "../src/lib/findings"
import { contractExample, otherExample } from "../src/lib/agent-integration"
import { unzipSync, strFromU8 } from "fflate"

const roots: string[] = []
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
  )
})
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "recat-source-"))
  roots.push(root)
  await mkdir(path.join(root, "finding/source/project-a/nested"), {
    recursive: true,
  })
  await mkdir(path.join(root, "finding/source/project-b"), { recursive: true })
  return { root, source: new FolderSource(root) }
}

test("Other findings load from the shared source folder and retain their exportable raw category", async () => {
  const { root, source } = await fixture()
  await writeFile(
    path.join(root, "finding/source/project-b/finding.json"),
    JSON.stringify({ ...otherExample, evidence: [] })
  )
  const snapshot = await source.scan()
  expect(snapshot.data.warnings).toEqual([])
  const findings = selectFindings(snapshot.data.findings, {
    assetType: "other",
  })
  expect(findings).toHaveLength(1)
  expect(findings[0].project).toBe("project-b")
  expect(findings[0].raw.asset_type).toBe("other")
  expect(findings[0].method).toBe("—")
})

test("settings persist under the Recat configuration directory", async () => {
  const { root, source } = await fixture()
  expect(source.configFile).toBe(path.join(root, ".recat/settings.json"))
})

test("generated finding layout loads reports, nested PoC files, contract tests, and archives", async () => {
  const { root, source } = await fixture()
  const folder = path.join(
    root,
    "finding/source/examplemy.com/bug/missing-authorization"
  )
  await mkdir(path.join(folder, "poc"), { recursive: true })
  await mkdir(path.join(folder, "test"))
  const evidence = {
    "README.md": "# Missing authorization\n\nLocal fixture verification.",
    "PASTE_EMAIL_READY.md":
      "Subject: Missing authorization\n\nSubmission draft.",
    "poc/request.txt": "Local reproduction fixture",
    "test/Authorization.t.sol": "// Local test fixture",
    "verification.json": JSON.stringify({
      title: "Verification",
      outcome: "true_positive",
    }),
  }
  for (const [filename, content] of Object.entries(evidence)) {
    await writeFile(path.join(folder, filename), content)
  }
  await writeFile(
    path.join(folder, "finding.json"),
    JSON.stringify({
      ...contractExample,
      status: "confirmed",
      verified: true,
      evidence: Object.keys(evidence),
    })
  )
  const snapshot = await source.scan()
  expect(snapshot.data.warnings).toEqual([])
  expect(snapshot.data.findings).toHaveLength(1)
  const finding = snapshot.data.findings[0]
  expect(finding.project).toBe("examplemy.com")
  expect(finding.sourcePath).toBe(
    "examplemy.com/bug/missing-authorization/finding.json"
  )
  expect(finding.raw.id).toBe("sc-001")
  expect(finding.status).toBe("confirmed")
  expect(finding.verified).toBe(true)
  for (const [filename, content] of Object.entries(evidence)) {
    expect((await source.readEvidence(finding.id, filename)).content).toBe(
      content
    )
  }
  const archive = await source.downloadProject(finding.id)
  expect(archive.filename).toBe("examplemy.com.zip")
  const files = unzipSync(archive.content)
  for (const [filename, content] of Object.entries(evidence)) {
    expect(
      strFromU8(files[`examplemy.com/bug/missing-authorization/${filename}`])
    ).toBe(content)
  }
  const archivedFinding = JSON.parse(
    strFromU8(files["examplemy.com/bug/missing-authorization/finding.json"])
  )
  expect(archivedFinding.id).toBe("sc-001")
  expect(archivedFinding.evidence).toEqual(Object.keys(evidence))
})
test("reads all project folders, preserving evidence and independent IDs", async () => {
  const { root, source } = await fixture()
  await writeFile(
    path.join(root, "finding/source/project-a/nested/a.json"),
    JSON.stringify({ id: "same", title: "Web result", evidence: ["proof.md"] })
  )
  await writeFile(
    path.join(root, "finding/source/project-b/b.json"),
    JSON.stringify({
      findings: [
        { id: "same", title: "Contract result", contract_address: "0x111" },
      ],
    })
  )
  const snapshot = await source.scan()
  expect(snapshot.data.findings).toHaveLength(2)
  expect(new Set(snapshot.data.findings.map((f) => f.id)).size).toBe(2)
  expect(snapshot.projects).toEqual(["project-a", "project-b"])
  expect(snapshot.data.findings[0].raw.evidence).toEqual(["proof.md"])
  expect(snapshot.data.findings[1].assetType).toBe("smart_contract")
  expect(
    selectFindings(snapshot.data.findings, { project: "project-a" })
  ).toHaveLength(1)
})
test("refresh sees edits and deletions and malformed files do not hide valid findings", async () => {
  const { root, source } = await fixture()
  const file = path.join(root, "finding/source/project-a/a.json")
  await writeFile(file, JSON.stringify({ title: "Before" }))
  await writeFile(
    path.join(root, "finding/source/project-b/bad.json"),
    "{invalid"
  )
  expect((await source.scan()).data.findings[0].title).toBe("Before")
  await writeFile(file, JSON.stringify({ title: "After" }))
  const updated = await source.scan()
  expect(updated.data.findings[0].title).toBe("After")
  expect(updated.data.warnings.some((w) => w.includes("bad.json"))).toBe(true)
  await rm(file)
  expect((await source.scan()).data.findings).toHaveLength(0)
})
test("persists folder settings and rejects missing directories without replacing settings", async () => {
  const { root, source } = await fixture()
  await mkdir(path.join(root, "another"))
  await source.saveFolder("another")
  expect((await new FolderSource(root).scan()).folder).toBe(
    path.join(root, "another")
  )
  await expect(source.saveFolder("missing")).rejects.toThrow()
  expect((await source.scan()).folder).toBe(path.join(root, "another"))
})
test("missing default folder produces an explicit warning and no demo data", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "recat-source-"))
  roots.push(root)
  const snapshot = await new FolderSource(root).scan()
  expect(snapshot.data.findings).toHaveLength(0)
  expect(snapshot.data.warnings.length).toBeGreaterThan(0)
})

test("reads listed Markdown evidence relative to its finding file and rejects unlisted or escaping paths", async () => {
  const { root, source } = await fixture()
  const folder = path.join(root, "finding/source/project-a")
  await writeFile(
    path.join(folder, "finding.json"),
    JSON.stringify({
      title: "Evidence fixture",
      evidence: ["proof.md", "../../outside.md", "missing.md"],
    })
  )
  await writeFile(
    path.join(folder, "proof.md"),
    "# Proof\n\nVerified in a local fixture."
  )
  await writeFile(path.join(root, "finding/outside.md"), "Private fixture")
  const finding = (await source.scan()).data.findings[0]
  const evidence = await source.readEvidence(finding.id, "proof.md")
  expect(evidence.content).toBe("# Proof\n\nVerified in a local fixture.")
  expect(evidence.format).toBe("markdown")
  await expect(source.readEvidence(finding.id, "unlisted.md")).rejects.toThrow()
  await expect(
    source.readEvidence(finding.id, "../../outside.md")
  ).rejects.toThrow()
  await expect(source.readEvidence(finding.id, "missing.md")).rejects.toThrow()
})

test("referenced JSON proof files are evidence rather than additional findings", async () => {
  const { root, source } = await fixture()
  const folder = path.join(root, "finding/source/project-a")
  await writeFile(
    path.join(folder, "finding.json"),
    JSON.stringify({ title: "Actual finding", evidence: ["proof.json"] })
  )
  await writeFile(
    path.join(folder, "proof.json"),
    JSON.stringify({ title: "Verification details", status: "verified" })
  )
  const snapshot = await source.scan()
  expect(snapshot.data.findings).toHaveLength(1)
  expect(snapshot.fileCount).toBe(1)
  const proof = await source.readEvidence(
    snapshot.data.findings[0].id,
    "proof.json"
  )
  expect(proof.content).toContain("Verification details")
})

test.skipIf(platform !== "win32")(
  "evidence exclusion follows Windows case-insensitive filenames",
  async () => {
    const { root, source } = await fixture()
    const folder = path.join(root, "finding/source/project-a")
    await writeFile(
      path.join(folder, "finding.json"),
      JSON.stringify({ title: "Actual finding", evidence: ["PROOF.JSON"] })
    )
    await writeFile(
      path.join(folder, "proof.json"),
      JSON.stringify({ title: "Proof document" })
    )
    const snapshot = await source.scan()
    expect(snapshot.data.findings).toHaveLength(1)
    expect(
      (await source.readEvidence(snapshot.data.findings[0].id, "PROOF.JSON"))
        .content
    ).toContain("Proof document")
  }
)

test("self references and evidence paths into another project do not hide actual findings", async () => {
  const { root, source } = await fixture()
  await writeFile(
    path.join(root, "finding/source/project-a/a.json"),
    JSON.stringify({ title: "A", evidence: ["a.json", "../project-b/b.json"] })
  )
  await writeFile(
    path.join(root, "finding/source/project-b/b.json"),
    JSON.stringify({ title: "B" })
  )
  expect((await source.scan()).data.findings).toHaveLength(2)
})

test("keeps original raw metadata and uses newest target coverage across project files", async () => {
  const { root, source } = await fixture()
  await writeFile(
    path.join(root, "finding/source/project-a/a.json"),
    JSON.stringify({
      findings: [
        {
          title: "A",
          project: "original-project",
          source_path: "original-file.json",
        },
      ],
      targets: [
        {
          name: "Old",
          host: "same.test",
          subdomains: 2,
          endpoints: 10,
          last_scan: "2026-09-20T00:00:00Z",
        },
      ],
    })
  )
  await writeFile(
    path.join(root, "finding/source/project-b/b.json"),
    JSON.stringify({
      findings: [{ title: "B" }],
      targets: [
        {
          name: "New",
          host: "same.test",
          endpoints: 30,
          last_scan: "2026-09-26T00:00:00Z",
        },
      ],
    })
  )
  const snapshot = await source.scan()
  expect(snapshot.data.findings[0].raw.project).toBe("original-project")
  expect(snapshot.data.findings[0].raw.source_path).toBe("original-file.json")
  expect(snapshot.data.findings[0].project).toBe("project-a")
  expect(snapshot.data.targets).toHaveLength(1)
  expect(snapshot.data.targets[0].endpoints).toBe(30)
  expect(snapshot.data.targets[0].subdomains).toBe(2)
})
