export function findingZipFilename(findingId: string) {
  let hash = 2166136261
  for (let index = 0; index < findingId.length; index++)
    hash = Math.imul(hash ^ findingId.charCodeAt(index), 16777619) >>> 0
  const safeId = findingId
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 71)
  const suffix = hash.toString(16).padStart(8, "0")
  return `finding-${safeId ? `${safeId}-` : ""}${suffix}.zip`
}
