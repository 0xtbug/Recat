import { expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import {
  agentPrompt,
  webExample,
  contractExample,
} from "../src/lib/agent-integration"
import { normalizeDataset } from "../src/lib/findings"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AgentIntegration } from "../src/components/agent-integration"

test("the installable agent package contains only the portable generated SKILL.md", () => {
  const directory = new URL("../skills/", import.meta.url)
  expect(readdirSync(directory)).toEqual(["SKILL.md"])
  const content = readFileSync(new URL("SKILL.md", directory), "utf8")
  expect(content).toBe(agentPrompt(""))
  expect(content).toContain("not to the agent workspace or installed skill")
  expect(content).not.toMatch(/[A-Za-z]:\\/)
})

test("agent integration targets the configured folder and examples match the importer", () => {
  const prompt = agentPrompt("D:\\reports\\findings")
  expect(prompt).toContain("D:\\reports\\findings")
  expect(prompt).toContain("false_positive")
  expect(prompt).toContain("candidate")
  expect(prompt).toContain("confirmed")
  expect(prompt).toContain("README.md")
  for (const example of [webExample, contractExample]) {
    const data = normalizeDataset(example)
    expect(data.warnings).toEqual([])
    expect(data.findings[0].status).toBe("candidate")
    expect(data.findings[0].evidence).toContain("README.md")
  }
  expect(normalizeDataset(contractExample).findings[0].assetType).toBe(
    "smart_contract"
  )
})

test("the single skill contains three importable asset examples and the active output layout", () => {
  const prompt = agentPrompt("/root/finding/source")
  expect(prompt).toContain("/root/finding/source/examplemy.com/bug/<name_poc>/")
  expect(prompt).toContain("PASTE_EMAIL_READY.md")
  expect(prompt).toContain("poc/")
  expect(prompt).toContain("test/")
  const examples = [...prompt.matchAll(/```json\n([\s\S]*?)\n```/g)].map(
    (match) => JSON.parse(match[1])
  )
  expect(examples).toHaveLength(3)
  expect(examples.slice(0, 2)).toEqual([webExample, contractExample])
  expect(examples[2].asset_type).toBe("other")
  expect(normalizeDataset(examples[2]).findings[0].assetType).toBe("other")
  expect(prompt).toContain("asset_type (web, smart_contract, or other)")
  for (const example of examples) {
    const data = normalizeDataset(example)
    expect(data.warnings).toEqual([])
    expect(data.findings[0].status).toBe("candidate")
    expect(data.findings[0].verified).toBe(false)
    expect(data.findings[0].delivery).toBe(example.deliverability)
    expect(data.findings[0].exposure).toBe(example.data_exposure)
    expect(data.findings[0].harm).toBe(example.harm)
    expect(data.findings[0].delivery.trim()).not.toBe("")
    expect(data.findings[0].exposure.trim()).not.toBe("")
    expect(data.findings[0].harm.trim()).not.toBe("")
    expect(example.cvss_score).toBeNull()
    expect(data.findings[0].cvss).toBeNull()
    expect(data.findings[0].vector).toBe("")
    expect(data.findings[0].evidence).toEqual([
      "README.md",
      "PASTE_EMAIL_READY.md",
    ])
  }
  expect(examples[0].url).toBe("https://example.test/search")
})

test("skill export has discoverable metadata and portable source configuration", () => {
  const skill = agentPrompt("D:\\reports\\findings")
  expect(skill).toMatch(/^---\nname: recat-findings\ndescription: .+\n---\n/)
  expect(skill).toContain(
    "D:\\reports\\findings\\examplemy.com\\bug\\<name_poc>\\"
  )
  expect(agentPrompt("")).toContain("Active source folder: finding/source")
})

test("Agent integration offers only SKILL.md with installation guidance for all three agents", () => {
  const markup = renderToStaticMarkup(
    createElement(AgentIntegration, { folder: "D:\\reports\\findings" })
  )
  expect(markup).toContain("SKILL.md")
  expect(markup).not.toContain("AGENTS.md")
  expect(markup).not.toContain("SOUL.md")
  expect(markup).toContain("Copy")
  expect(markup).toContain('download="SKILL.md"')
  const href = markup.match(/href="(data:text\/markdown[^"]+)"/)?.[1]
  expect(href).toBeDefined()
  const downloadText = href!.replaceAll("&#x27;", "'")
  expect(
    decodeURIComponent(downloadText.slice(downloadText.indexOf(",") + 1))
  ).toBe(agentPrompt("D:\\reports\\findings"))
  expect(markup).toContain(".agents/skills/recat-findings/SKILL.md")
  expect(markup).toContain(".claude/skills/recat-findings/SKILL.md")
  expect(markup).toContain(".hermes/skills/recat-findings/SKILL.md")
})
