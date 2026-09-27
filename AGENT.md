# Recat developer index

This is the shared map for developers and coding agents working on the Recat web repository. Start with [README.md](README.md) for usage and [SKILL.md](SKILL.md) for installation, configuration, and development workflows.

See [docs/findings.md](docs/findings.md) for the detailed import schema, source folder, evidence, and report-viewing reference.

## Repository boundaries

The Git repository and web application are currently in `frontend/` inside the workspace. Paths in this index are relative to that Git repository. The parent workspace holds `finding/source/`, `.recat/settings.json`, and mascot source artwork in `characters/`.

`skills/SKILL.md` is a portable finding-publishing skill for Codex, Claude Code, or Hermes. That folder contains only one file. The root `SKILL.md` is the website skill. Root `AGENT.md`, `AGENTS.md`, and `CLAUDE.md` guide developers; they are not exported as reporting-agent configurations.

## Entry points and configuration

| Path                       | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `package.json`, `bun.lock` | Bun commands and dependency versions; package name is `recat`    |
| `index.html`               | Browser title, favicon, and frontend entry                       |
| `src/main.tsx`             | React bootstrap and shared providers                             |
| `src/App.tsx`              | Session gate, navigation, sidebar branding, and workspace layout |
| `vite.config.ts`           | React, Tailwind, and local folder API in development/preview     |
| `.env.example`             | Server password configuration template                           |
| `server/start.ts`          | Production HTTP server, static assets, and API mounting          |

## Frontend

| Path                                                                      | Purpose                                                                      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `src/components/login-panel.tsx`                                          | Sign-in form and password visibility; drives mascot sleep                    |
| `src/components/mascot.tsx`                                               | Pointer tracking, click reactions, reduced-motion handling, and forced sleep |
| `src/components/dashboard.tsx`, `src/components/activity-chart.tsx`       | Findings overview, charts, and exploration                                   |
| `src/components/findings-table.tsx`                                       | Search, filters, sorting, and censored view                                  |
| `src/components/finding-detail.tsx`                                       | Resizable finding details                                                    |
| `src/components/evidence-viewer.tsx`                                      | Markdown/source and other text evidence                                      |
| `src/components/source-settings.tsx`                                      | Source folder selection and agent integration                                |
| `src/components/agent-integration.tsx`                                    | Copy/download of the single reporting `SKILL.md`                             |
| `src/components/import-dialog.tsx`                                        | JSON import and sample download                                              |
| `src/components/json-download.tsx`, `src/components/project-download.tsx` | JSON and project ZIP export                                                  |
| `src/components/ui/`                                                      | Shared shadcn/Base UI components                                             |
| `src/index.css`, `src/components/theme-provider.tsx`                      | Styles and light/dark theme                                                  |

## Data and server

| Path                             | Purpose                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `src/lib/findings.ts`            | Types, JSON normalization, status handling, filtering, and sorting               |
| `src/lib/mascot-tracking.ts`     | Eight-direction pointer geometry, size-based neutral area, and sector hysteresis |
| `src/lib/censor.ts`              | Masks identifying finding details without changing originals                     |
| `src/lib/agent-integration.ts`   | Reporting-skill text, installation guidance, and JSON examples                   |
| `src/hooks/use-folder-source.ts` | Workspace refresh and session-expiry handling                                    |
| `server/auth.ts`                 | Password loading, sessions, logout, and login rate limits                        |
| `server/api.ts`                  | Source/settings/evidence/ZIP and authentication routes                           |
| `server/folder-source.ts`        | Recursive scanning, persisted settings, evidence access, and ZIP creation        |

## Assets and tests

| Path                                                              | Purpose                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `public/recat.svg`                                                | Favicon                                                          |
| `public/recat-sample.json`                                        | Sample finding import                                            |
| `public/mascots/cybersec-orange-lens-{directions,reactions}.webp` | Current cyber cat sprite sheets                                  |
| `public/mascots/recat.png`                                        | README mascot logo                                               |
| `tests/agent-integration.test.ts`                                 | Single skill export, example normalization, and install guidance |
| `tests/mascot-tracking.test.ts`                                   | Sidebar edge tracking, full direction coverage, and forced sleep |
| `tests/auth.test.ts`                                              | Sessions, forged-cookie rejection, logout, and login rate limits |
| `tests/findings.test.ts`, `tests/censor.test.ts`                  | Data normalization, filters, and masking                         |
| `tests/folder-source.test.ts`, `tests/folder-api.test.ts`         | Scanning, evidence boundaries, ZIPs, and settings/API behaviour  |
| `qa/`                                                             | Local QA artifacts, excluded from Git and lint                   |

## Working rules

- Run Bun commands from this repository, where `package.json` lives.
- Keep `.env` and real source findings out of published examples and logs. Do not replace an existing password or source folder as a side effect of setup.
- Configuration uses `RECAT_PASSWORD`, `.recat/settings.json`, and `recat` cookie/browser preference keys. Preserve existing passwords and source settings during configuration changes.
- `candidate`, `confirmed`, and `false_positive` come from agent evidence. Recat displays findings; it does not scan targets or invent verification.
- Asset categories are `web`, `smart_contract`, and `other`. Explicit categories take precedence over supporting asset metadata; all remaining security findings belong to Other. Preserve raw records and avoid assigning a default HTTP method to non-web findings.
- Publishing-agent changes belong in `src/lib/agent-integration.ts`. Regenerate `skills/SKILL.md` with `agentPrompt("")` after changing the portable output.
- Keep the published `skills/` folder limited to `SKILL.md`.
- Preserve the sign-in rule: password visible means the cat stays asleep, including after pointer movement or a click.
- Verify relevant tests, lint, and build after implementation changes. Report any unavailable browser verification accurately.
