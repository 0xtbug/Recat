export const agentInstallation =
  "Install this single SKILL.md in your agent's recat-findings folder. Codex: .agents/skills/recat-findings/SKILL.md in the agent workspace. Claude Code: .claude/skills/recat-findings/SKILL.md in the agent workspace. Hermes: ~/.hermes/skills/recat-findings/SKILL.md. Start a new agent session after installation. The downloaded skill uses the active Recat source folder; the agent must be able to write to that folder."

export function agentPrompt(folder: string) {
  const source = folder.trim() || "finding/source"
  const separator = source.includes("\\") ? "\\" : "/"
  const exampleFolder = [
    source.replace(/[\\/]+$/, ""),
    "examplemy.com",
    "bug",
    "<name_poc>",
    "",
  ].join(separator)
  const header =
    "---\nname: recat-findings\ndescription: Use when bug hunting, reviewing web, smart contract, or other security vulnerabilities, preparing PoC reports, or saving and updating findings for Recat. Applies to authorized security findings and their reporting artifacts.\n---\n\n# Recat findings"
  return `${header}

Save the results of completed bug hunting work to the Recat platform. Apply this workflow when the user requests authorized bug hunting, vulnerability review, PoC reporting, or saving/updating findings. For unrelated tasks, follow the user's task without creating findings.

Active source folder: ${source}

## Source configuration

Before writing findings, resolve the active source folder to the same directory configured in Recat Settings. An absolute path from the downloaded skill can be used directly on the same machine. A relative path such as finding/source is relative to the Recat project root, one level above its web repository, not to the agent workspace or installed skill. If that root is unknown, ask the user for the absolute source folder first. Do not silently create a different output directory. When installing the repository's skills/SKILL.md, update the Active source folder line to the configured absolute path. No Recat login password or HTTP API call is needed to save files.

## Finding folders

Use the active source folder on the same filesystem as the Recat server. Automatically create <project>/bug/<name_poc>/ for each finding and save finding.json inside it. A hostname such as examplemy.com stays the project folder name; for smart contracts use the project or protocol name provided by the user. Use a filesystem-safe name for other project names and a descriptive, filesystem-safe slug for name_poc. Folder names are single path components, never absolute paths or traversal segments.

Example finding folder: ${exampleFolder}

Give every finding a unique, stable ID. Before creating a folder, check existing findings for that project and ID. Update the same folder for the same finding; if a name_poc is already used by a different finding, append the new finding ID. Do not overwrite other findings or change an existing finding ID during verification updates.

\`\`\`text
<active-source>/
  examplemy.com/
    bug/
      <name_poc>/
        finding.json
        README.md
        PASTE_EMAIL_READY.md
        verification.json     # when actual verification results are available
        poc/                  # reproduction scripts and supporting artifacts
        test/                 # smart contract test files, when applicable
\`\`\`

## Required files and evidence

- README.md: create the finding report with a summary, affected asset, vulnerability class and severity rationale, verification status, impact, reproduction steps, observed evidence, PoC/test commands and prerequisites, and recommendations. Clearly distinguish proven facts, supplied observations, and unchecked items. State when a command or test has not been run.
- PASTE_EMAIL_READY.md: create a ready-to-copy submission draft with a subject, summary, affected asset, impact, reproduction steps, evidence references, and remediation. Keep unknown recipients or program details unspecified. This is a draft; do not send the email or submit a report automatically.
- poc/: save or copy available reproducible PoC scripts, requests, responses, screenshots, and other supporting files. Preserve originals and document how to use them in README.md. Create only artifacts needed for the finding.
- test/: for smart contract findings, save available reproducible tests here, including the relevant setup and test command in README.md. If tests cannot be created or run, record the limitation rather than fabricate a passing result.
- verification.json: save actual verification results when available, including the outcome, checks performed, and limitations. Do not invent results.
- finding.json: publish the final normalized record after its referenced evidence files exist.

The evidence field is an array of relative file path strings, for example ["README.md", "PASTE_EMAIL_READY.md", "poc/reproduce.sh", "test/Authorization.t.sol", "verification.json"]. Include only files that have actually been created or copied. List individual files, not directories, and resolve paths relative to finding.json. Keep all report and evidence paths inside the finding folder. Do not include the Recat password or other credentials in reports.

## JSON schema and actual outcomes

Save UTF-8 JSON with id, title, asset_type (web, smart_contract, or other), vulnerability_type, severity (critical/high/medium/low/info), status, verified, found_at (ISO 8601 when known, otherwise null), impact, steps_to_reproduce (array of strings), payload, and evidence (array of relative filenames).

Choose web for websites and HTTP APIs, smart_contract for on-chain contract findings, and other for every remaining asset category, including mobile apps, desktop software, infrastructure, networks, hardware, and general security findings. Always set asset_type explicitly; an Other finding can still have a supporting URL or host. Describe its actual affected asset and platform in README.md and use source_file, source_line, host, or other relevant JSON fields when known. Keep project and finding folders in the same active source tree for all three categories.

Use only these status values; do not use "completed", "verified", or "open" as status:
- candidate: not yet scanned or checked; use this for a suspected or unverified issue.
- confirmed: scanning and checking are complete; the result is a true positive supported by evidence.
- false_positive: scanning and checking are complete; the finding is not valid.

Do not promote a candidate to confirmed based on assumptions or merely because a task was called completed. Set verified to true only for confirmed findings with supporting verification evidence. Preserve the distinction between a supplied result and a test you actually ran.

A supplied verification result can support confirmed after you review the reproducible artifacts, actual observed output, and their provenance; identify who performed the checks. An uninspected claim alone remains candidate. Do not claim you personally ran supplied tests.

For web findings include url, host, parameter, and method when known. For smart contracts include chain, chain_id, contract_address, contract_name, function_name, source_file, and source_line when known. source_file refers to the affected contract source, not the report or test path. Do not invent missing asset details, impact, timestamps, severity, or verification. Use severity info and explain an unknown severity in README.md when no assessment is available; omit unknown optional values. Use an empty payload and steps array when no payload or steps are available.

## Write and update workflow

Write files atomically: save each file to a temporary file with a .tmp extension in the destination folder, then rename it to its final name. For finding.json, validate JSON syntax, required fields, allowed status/severity values, stable ID, and the existence of each evidence file before the final rename. Publish evidence first and finding.json last, so Recat does not read a record before its files exist. Preserve existing evidence and verification history when updating the same finding.

After saving, report the paths of created or updated files and the actual verification outcome. Recat reads the source folder every 5 seconds; there is no need to send a password or call the login API. If the agent runs on another machine, use a shared folder or synchronize its output to the active Recat source folder first. If the source folder is unavailable, report the limitation rather than claim files were saved there.

## Web finding example

This fictional candidate illustrates the schema. Create README.md and PASTE_EMAIL_READY.md before using its evidence list. Replace example values with actual findings; add other evidence files only after they exist.

\`\`\`json
${JSON.stringify(webExample, null, 2)}
\`\`\`

## Smart contract finding example

This fictional candidate uses the same folder layout, with poc/ and test/ artifacts when available. It does not assert that a test has passed.

\`\`\`json
${JSON.stringify(contractExample, null, 2)}
\`\`\`

## Other finding example

This fictional mobile finding uses asset_type other. It shares the same report and evidence layout and does not invent an HTTP method or blockchain metadata.

\`\`\`json
${JSON.stringify(otherExample, null, 2)}
\`\`\`
`
}

export const webExample = {
  id: "web-001",
  title: "Potential reflected XSS in search",
  asset_type: "web",
  vulnerability_type: "Reflected XSS",
  severity: "medium",
  status: "candidate",
  verified: false,
  found_at: "2026-09-26T00:00:00Z",
  url: "https://example.test/search",
  host: "example.test",
  parameter: "q",
  method: "GET",
  impact: "Pending scan and verification.",
  steps_to_reproduce: [],
  payload: "",
  evidence: ["README.md", "PASTE_EMAIL_READY.md"],
}

export const contractExample = {
  id: "sc-001",
  title: "Potential missing authorization in setConfig",
  asset_type: "smart_contract",
  vulnerability_type: "Access Control",
  severity: "high",
  status: "candidate",
  verified: false,
  found_at: "2026-09-26T00:00:00Z",
  chain: "Local EVM",
  chain_id: 31337,
  contract_address: "0x1111111111111111111111111111111111111111",
  contract_name: "Treasury",
  function_name: "setConfig",
  source_file: "src/Treasury.sol",
  source_line: 42,
  impact: "Pending scan and verification.",
  steps_to_reproduce: [],
  payload: "",
  evidence: ["README.md", "PASTE_EMAIL_READY.md"],
}

export const otherExample = {
  id: "other-001",
  title: "Potential sensitive data stored in mobile app logs",
  asset_type: "other",
  vulnerability_type: "Sensitive Data Exposure",
  severity: "info",
  status: "candidate",
  verified: false,
  source_file: "app/logging.ts",
  impact: "Pending scan and verification.",
  steps_to_reproduce: [],
  payload: "",
  evidence: ["README.md", "PASTE_EMAIL_READY.md"],
}
