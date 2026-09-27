import { normalizeDataset } from "./findings"
import { demoAssessments } from "./demo-assessments"

const rows = [
  [
    "Reflected XSS in the name field",
    "Reflected XSS",
    "medium",
    "name",
    "POST",
    0,
  ],
  [
    "Stored XSS in the guestbook comment field",
    "Stored XSS",
    "high",
    "comment",
    "POST",
    1,
  ],
  [
    "DOM XSS via the location.hash router",
    "DOM-based XSS",
    "high",
    "hash",
    "GET",
    2,
  ],
  [
    "Reflected XSS in the search parameter",
    "Reflected XSS",
    "medium",
    "q",
    "GET",
    3,
  ],
  ["IDOR on the order detail endpoint", "IDOR", "high", "order_id", "GET", 3],
  [
    "BOLA in the vehicle report API",
    "IDOR",
    "critical",
    "vehicle_id",
    "GET",
    4,
  ],
  ["SSRF through the webhook test endpoint", "SSRF", "high", "url", "POST", 4],
  [
    "SQL injection in the coupon lookup",
    "SQL Injection",
    "critical",
    "q",
    "GET",
    5,
  ],
  [
    "Path traversal in the invoice download",
    "Path Traversal",
    "high",
    "file",
    "GET",
    6,
  ],
  [
    "Open redirect on the login return path",
    "Open Redirect",
    "low",
    "next",
    "GET",
    6,
  ],
  [
    "Mass assignment on the profile update",
    "Mass Assignment",
    "medium",
    "role",
    "PUT",
    7,
  ],
  [
    "Missing CSRF protection on email change",
    "CSRF",
    "medium",
    "email",
    "POST",
    8,
  ],
  [
    "Session persists after password reset",
    "Broken Auth",
    "medium",
    "token",
    "POST",
    9,
  ],
  [
    "GraphQL introspection exposed in production",
    "GraphQL",
    "low",
    "query",
    "POST",
    10,
  ],
  [
    "Internal application paths in error response",
    "Info Disclosure",
    "low",
    "id",
    "GET",
    12,
  ],
  [
    "Reflected XSS in the feedback preview",
    "Reflected XSS",
    "medium",
    "message",
    "POST",
    13,
  ],
] as const
const hosts = [
  "labs.hackerz.test",
  "api.crapi.test",
  "juice-shop.test",
  "dvwa.test",
]
const contractFindings = [
  {
    title: "Missing authorization on configuration update",
    vulnerability_type: "Access Control",
    severity: "high",
    contract_name: "Treasury",
    function_name: "setConfig",
    source_file: "src/Treasury.sol",
    source_line: 42,
    impact:
      "Configuration changes should require an authorized role. Review role checks and add regression coverage.",
  },
  {
    title: "Unchecked token transfer return value",
    vulnerability_type: "Unchecked Return Value",
    severity: "medium",
    contract_name: "Rewards",
    function_name: "distribute",
    source_file: "src/Rewards.sol",
    source_line: 78,
    impact:
      "A failed token transfer may leave internal accounting inconsistent. Use safe transfer handling.",
  },
  {
    title: "Rounding loss in share accounting",
    vulnerability_type: "Accounting",
    severity: "low",
    contract_name: "Vault",
    function_name: "previewDeposit",
    source_file: "src/Vault.sol",
    source_line: 105,
    impact:
      "Integer rounding may produce inconsistent share estimates. Define rounding direction and test boundary values.",
  },
  {
    title: "Initialization state requires review",
    vulnerability_type: "Initialization",
    severity: "medium",
    contract_name: "Registry",
    function_name: "initialize",
    source_file: "src/Registry.sol",
    source_line: 21,
    impact:
      "Confirm initialization is protected and cannot repeat after deployment.",
  },
].map((record, i) => ({
  ...record,
  id: `SC-${String(i + 1).padStart(3, "0")}`,
  ...demoAssessments[`SC-${String(i + 1).padStart(3, "0")}`],
  asset_type: "smart_contract",
  chain: "Local EVM",
  chain_id: 31337,
  contract_address: `0x${String(i + 1).repeat(40)}`,
  status: i === 0 ? "confirmed" : "candidate",
  found_at: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
  evidence: [`contract-review-${i + 1}.md`],
  source: "demo",
}))
export const otherFindings = [
  {
    id: "OTHER-001",
    title: "Potential sensitive data in Android debug logs",
    platform: "Android",
    vulnerability_type: "Sensitive Data Exposure",
    severity: "medium",
    source_file: "app/logging/SessionLogger.kt",
    impact:
      "Debug logs may contain session identifiers readable by a local diagnostic user. Exposure depends on build configuration and device permissions.",
    steps_to_reproduce: [
      "Use an isolated Android training build with synthetic session data.",
      "Exercise the sign-in flow and inspect the debug output for session identifiers.",
      "Compare release-build logging and required access permissions before confirming the finding.",
    ],
  },
  {
    id: "OTHER-002",
    title: "Potential writable configuration in a desktop service",
    platform: "Windows",
    vulnerability_type: "Insecure File Permissions",
    severity: "high",
    source_file: "service/config.json",
    impact:
      "A low-privilege user may be able to modify configuration consumed by a privileged service. Confirm effective permissions and the service's use of the file.",
    steps_to_reproduce: [
      "Use an isolated Windows training VM with a disposable service configuration.",
      "Inspect the configuration file's permissions from an unprivileged account.",
      "Test a harmless configuration change and document whether the service consumes it.",
    ],
  },
  {
    id: "OTHER-003",
    title: "Potential unauthenticated diagnostics on a network appliance",
    platform: "Network appliance",
    vulnerability_type: "Missing Authentication",
    severity: "medium",
    host: "appliance.lab.test",
    impact:
      "An exposed diagnostic interface may disclose device configuration. Verify network reachability, authentication requirements, and the actual data returned.",
    steps_to_reproduce: [
      "Use a network appliance simulator on an isolated training network.",
      "Review the diagnostic interface configuration and authentication requirements.",
      "Record a harmless diagnostic request and any returned synthetic data before confirming exposure.",
    ],
  },
].map((record) => ({
  ...record,
  ...demoAssessments[record.id],
  asset_type: "other",
  status: "candidate",
  verified: false,
  found_at: "2026-09-27T00:00:00Z",
  payload: "",
  evidence: ["README.md"],
  source: "demo",
}))

export const demoDocument = {
  agent: "Hermes",
  findings: [
    ...rows.map((r, i) => {
      const host =
        i < 4 || i === 9 || i === 10 || i === 15
          ? hosts[0]
          : i < 7 || i === 12 || i === 13
            ? hosts[1]
            : i === 7 || i === 11
              ? hosts[2]
              : hosts[3]
      return {
        id: `HMS-${String(i + 1).padStart(3, "0")}`,
        ...demoAssessments[`HMS-${String(i + 1).padStart(3, "0")}`],
        asset_type: "web",
        title: r[0],
        vulnerability_type: r[1],
        severity: r[2],
        parameter: r[3],
        method: r[4],
        found_at: new Date(
          Date.now() - (Number(r[5]) * 24 + 4) * 3_600_000
        ).toISOString(),
        host,
        url: `https://${host}/${i < 4 ? "labs/xss" : "api/v1"}/${i + 1}`,
        status: i < 10 ? "confirmed" : "candidate",
        verified: i < 10,
        impact:
          i === 0
            ? "Attacker-controlled input is reflected into the page without output encoding. JavaScript can run in the victim’s browser within the application origin, allowing page content to be read and actions to be performed as the user."
            : `The ${r[1]} finding could affect the confidentiality or integrity of the affected application. This sample describes a controlled training environment.`,
        steps_to_reproduce: [
          `Open the authorized lab endpoint: https://${host}/${i < 4 ? "labs/xss" : "api/v1"}/${i + 1}.`,
          `Submit the ${r[3]} parameter using the ${r[4]} method with the proof-of-concept input in the evidence record.`,
          "Observe the response and compare it with the expected application behavior. Capture the response and browser evidence to confirm reproducibility.",
        ],
        payload:
          i < 4 || i === 15
            ? '<script>document.body.setAttribute("data-proof", "HERMES");document.title="PROOF";</script>'
            : `${r[3]}=[proof-of-concept input]`,
        evidence: [
          `finding-${i + 1}.md`,
          `verify-${i + 1}.json`,
          `response-${i + 1}.txt`,
        ],
        source: "demo",
      }
    }),
    ...contractFindings,
    ...otherFindings,
  ],
  targets: [
    {
      name: "Hackerz Labs",
      host: hosts[0],
      subdomains: 9,
      endpoints: 42,
      last_scan: new Date(Date.now() - 3_600_000).toISOString(),
    },
    {
      name: "crAPI",
      host: hosts[1],
      subdomains: 1,
      endpoints: 68,
      last_scan: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    },
    {
      name: "OWASP Juice Shop",
      host: hosts[2],
      subdomains: 1,
      endpoints: 52,
      last_scan: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    },
    {
      name: "DVWA",
      host: hosts[3],
      subdomains: 1,
      endpoints: 24,
      last_scan: new Date(Date.now() - 4 * 3_600_000).toISOString(),
    },
  ],
}
export const demoDataset = normalizeDataset(demoDocument)
