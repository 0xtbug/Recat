import { expect, test } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ProjectDownload } from "../src/components/project-download"
import { findingZipFilename } from "../src/lib/finding-zip"
import type { Finding } from "../src/lib/findings"

test("finding ZIP download names the selected finding safely", () => {
  const first = {
    id: "project/bug/first:finding-1",
    project: "project",
  } as Finding
  const second = {
    id: "project/bug/second:finding-2",
    project: "project",
  } as Finding
  const firstMarkup = renderToStaticMarkup(
    createElement(ProjectDownload, { finding: first })
  )
  const secondMarkup = renderToStaticMarkup(
    createElement(ProjectDownload, { finding: second })
  )

  expect(firstMarkup).toContain("Download finding ZIP")
  expect(firstMarkup).toContain(
    `href="/api/project-zip?${new URLSearchParams({ finding: first.id })}"`
  )
  expect(firstMarkup).toContain(`download="${findingZipFilename(first.id)}"`)
  expect(secondMarkup).toContain(`download="${findingZipFilename(second.id)}"`)
})

test("long finding IDs with the same prefix get different ZIP filenames", () => {
  const prefix = `project/bug/${"a".repeat(100)}`
  const first = { id: `${prefix}:first`, project: "project" } as Finding
  const second = { id: `${prefix}:second`, project: "project" } as Finding
  const firstName = findingZipFilename(first.id)
  const secondName = findingZipFilename(second.id)
  const firstMarkup = renderToStaticMarkup(
    createElement(ProjectDownload, { finding: first })
  )
  const secondMarkup = renderToStaticMarkup(
    createElement(ProjectDownload, { finding: second })
  )

  expect(firstName).not.toBe(secondName)
  expect(firstMarkup).toContain(`download="${firstName}"`)
  expect(secondMarkup).toContain(`download="${secondName}"`)
})
