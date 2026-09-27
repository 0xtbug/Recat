---
name: recat-web
description: Automatically install and set up the Recat website from github.com/0xtbug/Recat, including prerequisites, dependencies, local password, findings folder, build, and server startup. Also use to repair or develop an existing Recat installation.
---

# Recat web setup

Install and start Recat when the user pastes this skill or asks for automatic website setup. This document works before the repository exists. Complete the setup using the available terminal tools; report any missing permissions or unavailable dependencies that prevent completion.

Repository: https://github.com/0xtbug/Recat

Clone URL: https://github.com/0xtbug/Recat.git

Use the user's chosen destination, source folder, and password when provided. Otherwise use the current workspace, preserve existing configuration, and generate a local password automatically. Ask only for information that actually blocks progress.

## 1. Acquire the repository

Check whether the current workspace already contains Recat: look for `package.json` with `name: recat`, `src/`, and `server/` at its root or in `frontend/`. Reuse an existing installation and preserve uncommitted changes. Do not pull, reset, or replace it during setup.

If Recat is absent, check `git --version`. Install Git through an available trusted OS package manager if needed, refresh the current process PATH or use the installed executable directly, and verify `git --version` before cloning into an unused directory:

```sh
git clone https://github.com/0xtbug/Recat.git Recat
```

Use the remote's default branch. If `Recat/` is occupied by unrelated files, choose an unused sibling directory. If the repository cannot be fetched, report the actual error; do not invent a substitute application or claim installation succeeded.

After cloning, locate the directory containing the Recat `package.json`. It may be the clone root or `frontend/`. Call this the **app directory**, and run all Bun commands there. Only now read its `AGENT.md` and README for repository-specific details. Relative documentation links in this skill resolve against that app directory.

The server resolves its workspace root as the parent of the app directory. Default findings live in `../finding/source`; settings live in `../.recat/settings.json`. Preserve existing records and settings.

## 2. Install prerequisites and dependencies

Check `bun --version`. If missing, install Bun using its [official installer](https://bun.com/docs/installation) for the current OS:

```sh
# macOS or Linux
curl -fsSL https://bun.com/install | bash
```

```powershell
# Windows PowerShell
irm https://bun.sh/install.ps1 | iex
```

Refresh the current process PATH or use the installed executable directly (`~/.bun/bin/bun` or `$env:USERPROFILE\.bun\bin\bun.exe`). Verify `bun --version` before continuing. On Linux, install `unzip` with the available package manager if the installer requires it. Use the environment's normal permission mechanism for protected actions.

Run `bun install` in the app directory. Stop dependent work if installation fails, diagnose the actual error, and retry only after addressing its cause.

## 3. Configure automatically

1. If `.env` is absent, create it from `.env.example`. If it exists, preserve its other settings.
2. Check whether a nonempty `RECAT_PASSWORD` is already configured without printing it. Preserve an existing password, including a password provided through the server environment.
3. If no password is configured, use the user's supplied password or generate one with `randomBytes(32).toString("base64url")` from `node:crypto`. Write it to `RECAT_PASSWORD` in `.env` using a local script. Replace only an empty password entry, or append the entry if missing. Do not log the value or include it in the final message. Confirm `.env` remains ignored by Git. Tell the user its absolute path so they can retrieve the password locally.
4. Read existing `../.recat/settings.json`, relative to the app directory, before selecting storage. Resolve its `folder` value against the parent of the app directory unless absolute. If it selects a valid source folder, keep it. If no settings exist, create `../finding/source` recursively without adding sample findings. If the user supplied a source folder, ensure it exists and record its absolute path for the post-start settings step below. Do not replace saved settings as a setup side effect. Report an unavailable saved source and request its location only if it cannot be resolved.

Use `RECAT_PASSWORD` without a `VITE_` prefix: the password belongs to the server. Changing it requires restarting the server.

## 4. Build, start, and verify

```sh
bun test
bun run build
bun run start
```

Run tests and build to completion before startup. Start `bun run start` as a managed background process and retain its process/session identifier. On Windows, a background `Start-Process` must use `-WindowStyle Hidden`; keep stdout and stderr in local log files. Reuse a healthy Recat server for this app directory if already running. Do not stop an unrelated process using the requested port; choose another free local port and set `PORT` for this server process.

The production server listens on `127.0.0.1:5173` by default and uses `PORT` when set. Confirm the actual bound URL from its output. If an inherited empty `RECAT_PASSWORD` shadows `.env`, remove that empty override only from the server's launch environment.

Verify that the process stays running, `GET /` returns the application, `GET /api/session` reports `configured: true`, and `GET /mascots/recat.png` returns the image. If browser access is available, open the URL and check the sign-in screen. Let the user enter the password; do not print it. Without browser access, report HTTP verification only. An empty findings folder is a valid initial installation.

Verify authenticated source access after the server is running: use a local script to `POST /api/login` with the password read privately from configuration and retain the session cookie in memory. If a source folder was explicitly supplied, apply it with `PUT /api/settings` and `{ "folder": "<absolute-source-path>" }`. In all cases, check `GET /api/source`: it must return the intended source directory without folder-access or configuration errors. Zero findings are valid. Then `POST /api/logout`. Keep passwords and cookies out of command arguments and logs. Do not change source settings when the user did not request a different folder.

Finish with the local URL, absolute app directory, credential location (the absolute `.env` path or an existing server environment setting), active source directory, and how to stop or restart the process. State test/build results and any remaining setup failure. Do not claim a clone or successful setup unless it actually happened.

For development requested by the user, use `bun run dev` instead and verify its printed URL. A static deployment alone cannot read findings or authenticate users; a running filesystem-backed server is required.

## Configure the publishing agent

Open **Settings → Agent integration** and download `SKILL.md`. It includes the active source folder. Install that single file in the agent's `recat-findings` skill directory using the README instructions. The repository's `skills/` directory contains only the portable reporting `SKILL.md`.

An agent needs filesystem access to the configured source folder; agents on other machines need shared storage or synchronization. Saving findings does not require the Recat login password. Do not use the website development skill as the agent's finding-output instructions.

## Develop and verify

Use the index in `AGENT.md` to identify the relevant frontend, server, or test module. Preserve source records, stable finding IDs, authentication, safe evidence-path checks, and the configured source folder. Keep the mascot's dark round eyes, single cyber lens, and slim cyan-trim jacket when making related UI changes.

Support all three asset categories: Web (`web`), Smart contract (`smart_contract`), and Other (`other`). Other covers mobile, desktop, infrastructure, networks, hardware, and all remaining findings. Use the shared asset labels in `src/lib/findings.ts`; keep the agent examples and portable `skills/SKILL.md` aligned with the importer.

The sidebar cat belongs to the left of the Recat text. The sign-in cat must sleep while the password is visible, ignoring pointer movement and boops, and wake when it is hidden. Normal boops and pointer tracking remain available when awake; reduced-motion users do not get the bounce.

Run verification appropriate to the changes:

```sh
bun test
bun run lint
bun run build
```

Verify actual results before reporting success. For UI changes, also inspect the affected screen at desktop and narrow widths when browser access is available. If a Windows build fails with a sandbox `spawn EPERM`, identify the blocked process and use the normal approval mechanism; do not alter app behaviour to hide an environment restriction.

## Troubleshooting

- Locked sign-in: check whether `RECAT_PASSWORD` is configured without printing its value; restart after a change. Repeated incorrect attempts are limited.
- Empty dashboard: inspect the active source folder and warnings. An empty folder has no substitute demo findings.
- Missing evidence: verify that the filename is listed in `evidence`, exists relative to the finding JSON, and stays inside the project folder.
- Missing mascot: verify both WebP URLs and that `public/` assets were copied into `dist/` by the build.
- Startup failure: inspect the actual error and the configuration before reinstalling dependencies or changing storage paths.
