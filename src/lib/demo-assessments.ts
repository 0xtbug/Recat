// Fictional assumptions for demonstrating report fields, not results of a scan.
function assessment(
  deliverability: string,
  data_exposure: string,
  harm: string,
  cvss_score: number,
  metrics: string,
  cvss_rationale: string
) {
  return {
    deliverability,
    data_exposure,
    harm,
    cvss_score,
    cvss_vector: `CVSS:3.1/${metrics}`,
    cvss_rationale: `Illustrative base assessment: ${cvss_rationale} Candidate assessments are provisional; no real target was tested.`,
    demo_note:
      "Fictional training example. Status, impact, and CVSS illustrate a simulated scenario; no external test was performed.",
  }
}

export const demoAssessments: Record<string, ReturnType<typeof assessment>> = {
  "HMS-001": assessment(
    "An unauthenticated attacker supplies the name field in a crafted POST form; the victim must submit it in the simulated lab.",
    "The scenario permits reading page data available to the victim's browser. Cookies protected by HttpOnly are outside this assumption.",
    "Script execution could alter the page and perform limited actions as the victim. No availability impact is assumed.",
    6.1,
    "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
    "Network access, no privileges, victim interaction, changed browser scope, and limited confidentiality/integrity impact."
  ),
  "HMS-002": assessment(
    "A signed-in user stores a script in a guestbook comment; another user must view the comment to trigger the simulated payload.",
    "The scenario assumes access to sensitive page data available to a victim viewing the stored comment.",
    "The script could read victim data and make significant changes through the victim's browser session. Service disruption is not assumed.",
    8.7,
    "AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N",
    "A low-privilege account and victim interaction are required; browser scope changes with high confidentiality/integrity impact."
  ),
  "HMS-003": assessment(
    "A victim opens a crafted URL whose fragment reaches an unsafe DOM sink. The attacker needs no account in the simulated scenario.",
    "Sensitive data rendered in the victim's browser is assumed readable by the injected script.",
    "Browser execution could disclose page data and change account state. The DOM sink and consequences require verification on a real target.",
    9.3,
    "AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N",
    "Network delivery, victim interaction, changed browser scope, and high confidentiality/integrity impact are simulated."
  ),
  "HMS-004": assessment(
    "An unauthenticated attacker shares a search URL containing the q parameter; the victim must open it.",
    "The simulated script can read limited application data in the rendered search page.",
    "Search results could be modified and limited victim actions initiated; loss of service is not part of this scenario.",
    6.1,
    "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
    "Reflected script execution requires victim interaction and crosses into browser scope with limited data and state impact."
  ),
  "HMS-005": assessment(
    "A signed-in customer changes order_id in the order detail request to access another customer's synthetic order.",
    "The scenario exposes another customer's order details, delivery address, and contact information; modification is not assumed.",
    "Cross-account disclosure could compromise customer privacy. The demonstration uses synthetic customer records.",
    6.5,
    "AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",
    "A low-privilege account is required; unauthorized read access has high confidentiality impact with unchanged scope."
  ),
  "HMS-006": assessment(
    "An unauthenticated request changes vehicle_id in a vehicle report API assumed to lack both authentication and object authorization.",
    "The scenario exposes private vehicle reports and owner information across synthetic accounts.",
    "The same fictional interface allows unauthorized report changes, affecting confidentiality and integrity without assumed service disruption.",
    9.1,
    "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
    "No account or victim interaction is required; high confidentiality/integrity impact is an explicit demo assumption."
  ),
  "HMS-007": assessment(
    "A signed-in user supplies an internal destination to a webhook test feature that is assumed to lack destination restrictions.",
    "The scenario returns sensitive responses from an internal service reached by the webhook worker.",
    "Internal data could be disclosed across the worker's security boundary. State changes and denial of service are not assumed.",
    7.7,
    "AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N",
    "A low-privilege account initiates a server-side request into a different security scope with high confidentiality impact."
  ),
  "HMS-008": assessment(
    "An unauthenticated user submits input to a coupon lookup assumed to concatenate q into a database query.",
    "The simulated database account can read all synthetic application records.",
    "The scenario also assumes database write and destructive query permissions, allowing data modification and service disruption.",
    9.8,
    "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    "Unauthenticated network exploitation and broad database permissions produce high confidentiality, integrity, and availability impact."
  ),
  "HMS-009": assessment(
    "An unauthenticated invoice download accepts a file path without enforcing the intended download directory in this scenario.",
    "Sensitive files readable by the application service account are assumed exposed; arbitrary writes are not included.",
    "Disclosure could reveal application secrets or private documents. The demo does not assume subsequent credential misuse.",
    7.5,
    "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
    "Network access without privileges or interaction exposes sensitive readable files in the same security scope."
  ),
  "HMS-010": assessment(
    "A victim follows a crafted login link whose next parameter points outside the application. The scenario requires additional phishing conditions.",
    "The redirect alone is not assumed to reveal application records or credentials.",
    "A trusted-looking link could route a victim to attacker-controlled content. Limited browser content integrity impact is assumed.",
    3.1,
    "AV:N/AC:H/PR:N/UI:R/S:U/C:N/I:L/A:N",
    "Victim interaction and additional attack conditions are required; only limited integrity impact is assumed."
  ),
  "HMS-011": assessment(
    "A signed-in user may submit the role property in a profile update. Acceptance of this property remains unverified.",
    "No data disclosure is assumed by this provisional assessment; access to privileged data has not been checked.",
    "If role assignment is accepted, unauthorized account changes could cause high integrity impact. This remains a candidate.",
    6.5,
    "AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N",
    "Provisional assumption: a low-privilege account can alter protected role state, with high integrity impact only."
  ),
  "HMS-012": assessment(
    "A signed-in victim must visit attacker-controlled content that submits an email change. CSRF defenses have not been verified.",
    "This provisional scenario assumes no direct read access to account data through the cross-site request.",
    "An unauthorized email change could affect account ownership if accepted. Recovery and further account takeover remain untested.",
    6.5,
    "AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N",
    "The attacker needs no account, but victim interaction is required; the assumed impact is a protected account-state change."
  ),
  "HMS-013": assessment(
    "An attacker would need a previously obtained session token that may remain valid after a password reset; persistence is unverified.",
    "The provisional scenario assumes limited account data remains readable through the old session.",
    "Limited account changes could remain possible after reset. Token theft itself is not demonstrated by this candidate.",
    4.2,
    "AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N",
    "A usable existing session and reset timing create additional conditions; limited confidentiality/integrity impact is assumed."
  ),
  "HMS-014": assessment(
    "An unauthenticated client may request GraphQL schema introspection. Whether the production-like fixture permits it is unverified.",
    "The provisional assessment assumes sensitive schema metadata is revealed, without exposing resolver results or customer records.",
    "Schema disclosure could assist reconnaissance. Introspection alone does not establish an authorization bypass.",
    3.7,
    "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
    "Limited confidentiality impact is assumed only if the schema is sensitive; useful exploitation requires additional conditions."
  ),
  "HMS-015": assessment(
    "An attacker may send a malformed id to provoke an error response. The response contents have not been verified.",
    "The provisional scenario reveals internal application paths, with no assumed credentials or customer records.",
    "Path details could assist reconnaissance but do not by themselves demonstrate code execution or data modification.",
    3.7,
    "AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
    "Limited sensitive metadata disclosure is assumed; turning paths into a useful attack requires additional conditions."
  ),
  "HMS-016": assessment(
    "A victim may submit an attacker-supplied feedback message to a preview page. Unsafe reflection and browser execution remain unchecked.",
    "The provisional scenario exposes limited page data in the feedback preview, not demonstrated production data.",
    "If the script executes, it could alter the preview and initiate limited victim actions. No actual execution has been confirmed.",
    6.1,
    "AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
    "Provisional reflected XSS: no attacker privileges, required victim interaction, and limited browser-scope confidentiality/integrity impact."
  ),
  "SC-001": assessment(
    "An arbitrary wallet calls Treasury.setConfig in the simulated Local EVM fixture without the intended authorized role.",
    "No private-data disclosure is assumed; public contract state is already readable.",
    "Unauthorized configuration changes could affect treasury behavior and interrupt expected operations; fund theft is not assumed.",
    8.2,
    "AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L",
    "Public transaction access requires no contract role; high integrity and limited availability impact are simulated."
  ),
  "SC-002": assessment(
    "An authorized reward distributor may call distribute with a token that returns false. Handling of that result remains unchecked.",
    "No additional data exposure is assumed; the candidate concerns accounting updates after a failed transfer.",
    "Rewards could be marked paid despite failed delivery, causing inconsistent balances if the suspected behavior is confirmed.",
    4.9,
    "AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:N",
    "A privileged distributor is required in this provisional scenario; only high accounting-integrity impact is assumed."
  ),
  "SC-003": assessment(
    "A public caller may use a boundary deposit amount that triggers rounding in previewDeposit; the actual rounding error remains unverified.",
    "No data disclosure is assumed; share calculations use public contract state.",
    "Incorrect share estimates could cause limited accounting discrepancies. Repeated extraction or material fund loss is not assumed.",
    3.7,
    "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N",
    "Special boundary conditions and low integrity impact are assumed, without private data disclosure or service disruption."
  ),
  "SC-004": assessment(
    "An arbitrary wallet might initialize a Registry left uninitialized after deployment; the deployment window and protections remain unchecked.",
    "No private-data exposure is assumed; the candidate concerns initialization of privileged state.",
    "Unexpected ownership or configuration changes could have high integrity impact if initialization can be captured. Fund loss is unverified.",
    5.9,
    "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:H/A:N",
    "Provisional assessment assumes a specific uninitialized deployment window and high integrity impact in unchanged scope."
  ),
  "OTHER-001": assessment(
    "A local diagnostic user would need permission to read Android debug logs while synthetic session data is being logged. These conditions are unchecked.",
    "Session identifiers may appear in debug output. Actual log contents and release-build behavior remain unverified.",
    "Disclosure could compromise session confidentiality if sensitive identifiers are present; replay or account modification is not assumed.",
    5.5,
    "AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",
    "Provisional local access with diagnostic privileges exposes sensitive session data; no integrity or availability impact is assumed."
  ),
  "OTHER-002": assessment(
    "A local unprivileged account may edit configuration used by a Windows service. Effective file permissions and service consumption remain unchecked.",
    "No direct data disclosure is assumed; the suspected issue is unauthorized configuration modification.",
    "Changed service behavior could compromise protected state and interrupt service operations if the candidate is confirmed.",
    6.1,
    "AV:L/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:L",
    "Provisional local low-privilege access permits high integrity and limited availability impact within the service scope."
  ),
  "OTHER-003": assessment(
    "A client on the adjacent training network may access diagnostics without authentication. Reachability and authentication remain unverified.",
    "Device configuration and network metadata may be returned; sensitive credentials or private user data have not been demonstrated.",
    "Limited configuration disclosure could assist network reconnaissance. Configuration writes and service disruption are not assumed.",
    4.3,
    "AV:A/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
    "Provisional adjacent-network access requires no account and exposes limited configuration data in unchanged scope."
  ),
}
