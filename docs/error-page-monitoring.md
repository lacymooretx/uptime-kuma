# Error-Page Keyword Monitoring — Handoff

## Problem
Uptime Kuma's current HTTP monitors treat 2xx as "up". Several self-hosted apps render user-visible error pages (e.g. ASP.NET Core "An error occurred while processing your request.") that may still return 200 OK — or hit a path like `/health` that succeeds while `/` fails. Result: silent failures, no alert.

**Triggering example:** `https://service-log.3endt.com` (servicetracker) rendered the ASP.NET Core error page while the existing monitor stayed green.

## Goal
1. Add **keyword monitors** in Uptime Kuma that alert when a rendered error-page string appears on the homepage (inverse keyword match).
2. **Fix at the source** where possible — ensure the app returns a proper 5xx so plain HTTP monitors also catch it.

## Scope — survey of services on Vultr Proxmox box
Source: `~/code/vultr-proxmox/services/` (30 docker-compose services on `docker.aspendora.com`).

### Recommended for keyword monitor (13)
| # | Service | Hostname | Stack |
|---|---------|----------|-------|
| 1 | servicetracker | service-log.3endt.com | ASP.NET Core |
| 2 | aspendora-console | rd.aspendora.com | FastAPI + React |
| 3 | aspendorachat | internal | ASP.NET Core |
| 4 | callqa | callqa.aspendora.com | ASP.NET Core |
| 5 | controlr | controlr.aspendora.com | ASP.NET Blazor |
| 6 | emailbridge | internal | ASP.NET Core |
| 7 | file-share-blazor | internal | ASP.NET Blazor |
| 8 | imtec-sql-ip | internal | Flask |
| 9 | infodex | infodex.3endt.com | Node + OnlyOffice |
| 10 | media-toolkit | internal | FastAPI + React |
| 11 | people-directory | people.3endt.com | ASP.NET Core |
| 12 | ticket-auditor | tickets-analysis.aspendora.com | Python + oauth2-proxy |
| 13 | user-management | user-management.3endt.com | ASP.NET Blazor |

### Skipped
- **Off-the-shelf mature OSS:** formbricks, meshcentral, n8n, portainer, uptime-kuma, kasm, rustdesk, sftpgo, it-tools, mail-intake.
- **Not user-facing web UI:** defiant2 (proxy), clerkchat-cw-sync (worker), quarantine-ticket (worker).
- **Maybe — awaiting decision:** defiant-editor, defiant-mgmt, homepro, openclaw.

## Status — 2026-05-10
**Phase 1 (keyword monitors) complete.** Source-fix phase still pending.

### Provisioning summary
- 20 keyword monitors live in production (Uptime Kuma IDs 63–82), provisioned via `scripts/provision-keyword-monitors.py`.
- 19 currently UP, 1 (`homepro`) is correctly UP after we added `403` to its accepted-status-codes (oauth2-proxy returns 403 to anonymous requests by design).
- All 20 use a 120s check interval and 2 retries before alerting.

### Decisions made
1. **Scope expanded from 13 → 20** based on a 2026-05-10 audit of `~/code` and the live deploy host. Added: n8n (we own a fork at `~/code/n8n` with `Dockerfile.aspendora`), formbricks (we own deployment + data, no code fork), meshcentral (we own deployment wrapper at `~/code/meshcentral-aspendora`), defiant-editor, defiant-mgmt, homepro, openclaw.
2. **Provisioning via REST API** with the bootstrap key — reproducible and idempotent. Script at `scripts/provision-keyword-monitors.py`.
3. **Two-pattern keyword strategy:**
   - **Public pages (15)** — match expected content (e.g. page title), `invertKeyword=False` so monitor goes DOWN when the expected string disappears. Catches blank pages, wrong content, framework error pages, upstream 502s — anything that breaks the page.
   - **OIDC-gated pages (5)** — match the canonical ASP.NET Core error string `An error occurred while processing your request`, `invertKeyword=True` so monitor goes DOWN when that string appears. The `/` of these apps is normally a 302 to Microsoft sign-in; the error string only shows up if the app fails before the auth pipeline runs.
4. **Source-fix breadth — deferred to Phase 2.** Servicetracker first (the original triggering example), then sweep ASP.NET apps we own. Tracked separately.

## Provisioned monitors

### Public pages — keyword should be present
| Service | URL | Keyword |
|---|---|---|
| controlr | https://control.aspendora.com/ | `_framework/dotnet` |
| callqa | https://callqa.aspendora.com/ | `Call QA Dashboard` |
| file-share-blazor | https://share.aspendora.com/ | `Aspendora File Share` |
| imtec-sql-ip | https://imtec-sql-ip.aspendora.com/ | `IMTEC SQL IP` |
| infodex | https://infodex.ir100.com/ | `Infodex` |
| media-toolkit | https://media-toolkit.aspendora.com/ | `Media Toolkit` |
| people-directory | https://people.3endt.com/ | `People Directory` |
| user-management | https://user-management.aspendora.com/ | `User Management Portal` |
| aspendora-console | https://rd.aspendora.com/ | `Aspendora Remote Console` |
| n8n | https://automations.aspendora.com/ | `Aspendora Automations` |
| formbricks | https://surveys.aspendora.com/ | `Formbricks` |
| meshcentral | https://central.aspendora.com/ | `Aspendora` |
| defiant-editor | https://defiant-editor.aspendora.com/ | `Defiant Markdown Editor` |
| defiant-mgmt | https://defiant-mgmt.aspendora.com/ | `Defiant Management` |
| openclaw | http://10.10.30.101:18789/ | `OpenClaw Control` |

### OIDC-gated pages — alert when error string present
| Service | URL | Keyword |
|---|---|---|
| servicetracker | http://10.10.30.101:8280/ | `An error occurred while processing your request` |
| aspendorachat | https://chat.aspendora.com/ | `An error occurred while processing your request` |
| emailbridge | https://emailbridge.aspendora.com/ | `An error occurred while processing your request` |
| ticket-auditor | https://tickets-analysis.aspendora.com/ | `An error occurred while processing your request` |
| homepro | https://upgrade-3endt.aspendora.com/ | `An error occurred while processing your request` |

## Skipped (true off-the-shelf, no source ownership)
`it-tools`, `kasm`, `mail-intake` (Mailu), `portainer`, `rustdesk`, `sftpgo`. Mature OSS we just pull images for; their own healthchecks already cover failure modes and we have no source to fix.

## Skipped (workers / no UI)
`clerkchat-cw-sync`, `quarantine-ticket`, `defiant2` (caddy proxy).

## Phase 2 — Source-fix backlog
Apps where we own source and could return a real 5xx instead of a 200 error page (so even plain HTTP monitors would catch the failure):

- **servicetracker** (the original triggering example) — ASP.NET Core. Add an exception filter or register the health-checks middleware on `/`. Source: `~/code/3eprojects/service-app`.
- **callqa, controlr, aspendorachat, emailbridge, file-share-blazor, people-directory, user-management, defiant-editor, defiant-mgmt** — same pattern across the ASP.NET / Blazor fleet.
- **imtec-sql-ip** (Flask) — disable debug, add a 500-handler that returns proper status.
- **infodex** (Node) — confirm Express error handler returns 5xx.
- **media-toolkit, aspendora-console, ticket-auditor, homepro** (Python/FastAPI) — confirm framework error handler.
- **n8n** — fork has `Dockerfile.aspendora`; could add custom error middleware.

## Relevant context
- **Uptime Kuma REST API:** `/api/v1` — bootstrap key in `UPTIME_KUMA_BOOTSTRAP_API_KEY` (commit 28d4a586). Keyword monitor type is supported natively. JWT-bearer auth was added in commit `f71027ea` so OIDC tokens also work.
- **Production hosts (corrected 2026-04-19):**
  - VM 300 (`10.10.30.174`) — Uptime Kuma + NPM. Reached via `ssh -J pve-dal-01 root@10.10.30.174`.
  - VM 301 (`10.10.30.101`) — all the apps. `ssh -J pve-dal-01 root@10.10.30.101`.
  - The old VPS (`docker.aspendora.com` / `149.28.251.164`) was decommissioned 2026-04-19.
- **Provisioning script:** `scripts/provision-keyword-monitors.py`. Idempotent — re-running skips monitors that already exist by name.
- **servicetracker compose:** `~/code/vultr-proxmox/services/servicetracker/docker-compose.yml` — already has `/health` healthcheck that returns 200 regardless of page errors; this is why the error on `/` wasn't caught.

## Re-running the provisioner
```bash
# Bootstrap key auto-resolved from ~/.secrets/.env
python3 scripts/provision-keyword-monitors.py --dry-run   # preview
python3 scripts/provision-keyword-monitors.py             # create missing
```

## Verifying alerts fire
Temporarily induce a failure and confirm the monitor catches it:
```bash
# Stop the upstream container; the keyword check should flip to DOWN within ~3 minutes
ssh -J pve-dal-01 root@10.10.30.101 'cd /opt/services/<service> && docker compose stop'
# Watch from Pulse: https://uptime.aspendora.com/v2/incidents
ssh -J pve-dal-01 root@10.10.30.101 'cd /opt/services/<service> && docker compose start'
```
