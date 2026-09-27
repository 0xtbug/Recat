# Findings reference

[Back to README](../README.md)

## Source folder

The default source is `finding/source` relative to the project root, one level above `frontend/`. Open **Settings** to change it to an existing absolute path, or a path relative to the project root. Settings persist in `.recat/settings.json` at the root.

The server password is configured with `RECAT_PASSWORD`. Source settings persist in `.recat/settings.json` in the parent workspace.

All project subfolders are scanned recursively every 5 seconds. Refresh reads immediately. Added, edited, and deleted files update the workspace. Symbolic links are not followed. Invalid JSON, unreadable files, and files over 10 MB produce warnings while other valid files remain visible. No demo data is substituted for an empty source.

```text
finding/source/
  project-a/findings.json
  project-b/contracts/finding.json
```

Supports a single finding, an array, or an envelope with `findings` and optional `targets`. Only a nonempty `title` is required:

```json
{
  "findings": [
    {
      "id": "finding-001",
      "title": "Configuration authorization finding",
      "asset_type": "smart_contract",
      "severity": "high",
      "status": "confirmed",
      "vulnerability_type": "Access Control",
      "chain": "Local EVM",
      "chain_id": 31337,
      "contract_address": "0x1111111111111111111111111111111111111111",
      "contract_name": "Treasury",
      "function_name": "setConfig",
      "source_file": "src/Treasury.sol",
      "source_line": 42,
      "impact": "Describe the demonstrated impact.",
      "steps_to_reproduce": ["Describe a reproducible step."],
      "evidence": ["finding.md", "verification.json"]
    }
  ]
}
```

### Asset categories

| `asset_type`     | Category       | Use for                                                                                  |
| ---------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `web`            | Web            | Websites and HTTP APIs                                                                   |
| `smart_contract` | Smart contract | On-chain contract findings                                                               |
| `other`          | Other          | Mobile, desktop, infrastructure, networks, hardware, and all remaining security findings |

Agents should always set `asset_type` explicitly. An explicit `other` remains Other even when its evidence includes a URL, host, or contract address. Unrecognized categories also display as Other; original JSON is preserved. For older records without a category, a contract address implies Smart contract; URL, host, HTTP method, or parameter metadata implies Web; otherwise the finding displays as Other. Non-web findings do not get an invented default HTTP method.

Other findings use the same source folder, status, evidence viewer, and export workflow. For example:

```json
{
  "id": "other-001",
  "title": "Potential sensitive data in mobile app logs",
  "asset_type": "other",
  "vulnerability_type": "Sensitive Data Exposure",
  "severity": "info",
  "status": "candidate",
  "verified": false,
  "source_file": "app/logging.ts"
}
```

Describe the affected platform and supporting evidence in the report. Web findings can use `url`, `host`, `parameter`, and `method`. Other fields include `found_at`, `cvss_score`, `cvss_vector`, `verified`, `payload`, `deliverability`, `data_exposure`, and `harm`. Coverage uses `targets` records with `name`, `host`, `subdomains`, `endpoints`, and `last_scan`.

The reporting skill requires top-level `deliverability` (attack path and prerequisites), `data_exposure` (affected data and demonstrated scope), and `harm` (supported consequences). Writing these only in the Markdown report or `impact` does not populate their dashboard fields. Explain unverified or inapplicable assessments explicitly. Include `cvss_score` and a matching version-prefixed `cvss_vector` when supported by the evidence, with the metric rationale in the report. Otherwise use `cvss_score: null` and `cvss_vector: ""` and explain the limitation in the report. Recat displays reported CVSS values; it does not calculate a score from severity or Markdown evidence.

Finding status comes from the agent's JSON output:

- `candidate`: not yet scanned or checked; this is the default for a new finding.
- `confirmed` (also accepts `true_positive`): scanned and checked, with a true positive result.
- `false_positive`: scanned and checked, with an invalid finding result.

Status spelling is case-insensitive; spaces and hyphens are accepted in place of underscores. Original JSON stays unchanged. A separate `verified` badge is shown only for confirmed findings with explicit supporting verification. Recat displays these outcomes and does not perform vulnerability scans or automatically confirm findings.

Project names come from the first subfolder; files directly in the source folder use its name. Findings retain their original record ID in the raw JSON; UI IDs include the relative file path to avoid cross-project collisions. The Project filter and search include project/source metadata. Payloads are displayed as text.

**Censored mode** in Findings masks identifying details, descriptions, payloads, and raw records with `***`, and hides PoC contents. Severity, class, status, dates, and counts stay visible. Copy uses the masked text, and downloads are disabled while this mode is active. The preference persists in this browser; source files are unchanged. This is a display setting, not a replacement for login or access control.

## Proof of Concept files

List filenames in the record's `evidence` array. Paths resolve relative to the findings JSON file and must stay inside that project's folder. In **Proof of Concept**, select a file to read it. Markdown offers rendered and Source views; **Copy content** copies the original file text. Text, JSON, HTML (as text), Solidity, and log files also display as text. Files must be under 2 MB. Referenced JSON proof files are excluded from findings aggregation.

Evidence is read from the configured source folder. Markdown is rendered without executing embedded HTML or scripts. Missing or unsupported files show an error in the viewer. A sample import is available at `/recat-sample.json` on the running application.

## Detail panel

Drag the left edge of the right panel to resize it. The handle supports Left/Right (Shift for larger steps), Home/End, and double-click to reset. Mobile uses the full viewport width. All scrolling uses the official shadcn ScrollArea with default appearance; theme CSS remains unchanged.
