# Claude Run Log — REST API Implementation

## 2026-03-19 — Session Start

### Step 1: Codebase Exploration
- **Goal:** Understand existing architecture
- **What:** Read server.js (1998 lines), auth.js (177 lines), client.js (249 lines), all 9 socket handlers
- **Result:** Complete understanding of Socket.IO handler patterns, auth system, ORM usage

### Step 2: Create Service Layer (Phase 1)
- **Goal:** Extract business logic into reusable services
- **What:** Created 12 service files in server/services/
- **Files created:** tag-service.js, notification-service.js, database-service.js, api-key-service.js, docker-host-service.js, proxy-service.js, remote-browser-service.js, maintenance-service.js, status-page-service.js, incident-service.js, settings-service.js, monitor-service.js

### Step 3: Refactor Socket Handlers (Phase 1 cont.)
- **Goal:** Make socket handlers thin wrappers calling services
- **Files modified:** All 9 socket handler files + server.js

### Step 4: REST Router Infrastructure (Phase 2)
- **Goal:** Create auth middleware and router framework
- **What:** Added `verifyAPIKeyAndGetUserID()` and `restApiAuth` to auth.js, created middleware.js and index.js, mounted `/api/v1` router

### Step 5: REST Endpoint Routers (Phases 3-5)
- **Goal:** Create all REST endpoint files
- **Files created:** 14 router files in server/routers/api-v1/ with 72 total endpoints

### Step 6: Bug Fix — JSON.stringify(undefined) in monitor-service.js
- **Goal:** Fix monitor creation failing when optional fields missing
- **What:** Added default empty arrays/objects for kafkaProducerBrokers, kafkaProducerSaslOptions, conditions, rabbitmqNodes
- **Files modified:** server/services/monitor-service.js (add and edit methods)

### Step 7: Bug Fix — PATCH /monitors/:id field format
- **Goal:** Fix PATCH endpoint failing due to field format mismatch
- **What:** Parse JSON string fields back to objects before merging for re-serialization
- **Files modified:** server/routers/api-v1/monitors.js

### Step 8: Final Verification
- **Syntax:** All 37 files pass node --check
- **Integration tests:** 25/26 pass
  - All auth flows work (no auth, bad key, user/pass, API key)
  - Full CRUD on tags, monitors, API keys
  - PATCH with merge works correctly
  - Monitor pause/resume/beats/chart all work
  - Settings, database, notifications all work
  - Maintenance requires full frontend-format input (dateRange array) — same as Socket.IO

### Step 9: Production Deployment
- **Goal:** Deploy to docker.aspendora.com as uptime.aspendora.com
- **What:**
  1. Replaced stale Cloudflare tunnel CNAME with A record → 149.28.251.164 (proxied)
  2. rsync'd source to /opt/docker/uptime-kuma/ on server
  3. Created Dockerfile (node:20-slim, npm ci --legacy-peer-deps, download-dist)
  4. Built custom Docker image on server (fixed: added extra/ dir for migrations)
  5. Added service to /opt/docker/docker-compose.yml with volume `uptime_kuma_data`
  6. Added nginx config for uptime.aspendora.com (SSL + WebSocket proxy)
  7. Pre-configured SQLite db-config.json
  8. Verified: server running, DB migrated, https://uptime.aspendora.com returns 302
  9. Verified: REST API at /api/v1/info returns proper 401 JSON
- **Status:** Live, awaiting initial admin user setup via web UI

### Step 10: OIDC Authentication (Entra ID / "Sign in with Microsoft")
- **Timestamp:** 2026-03-19
- **Goal:** Add OIDC authentication via Microsoft Entra ID
- **What:**
  1. Created `/server/routers/oidc-router.js` — Express router handling the full OIDC auth code flow
     - GET `/auth/oidc/status` — reports whether OIDC is configured
     - GET `/auth/oidc/login` — redirects to Entra ID authorize endpoint with nonce/state cookies
     - GET `/auth/oidc/callback` — exchanges auth code for tokens, checks group membership via `groups` claim, auto-provisions local user, issues JWT, redirects to `/dashboard?token=...`
  2. Edited `/server/server.js` — mounted cookie-parser middleware and OIDC router at `/auth/oidc` after the REST API v1 router but before the status page router and catch-all route
- **Files created:** server/routers/oidc-router.js
- **Files modified:** server/server.js (lines 365-369)
- **Dependencies required (NOT installed):** `openid-client@5`, `cookie-parser`
- **Environment variables required:** OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_TENANT_ID, OIDC_CALLBACK_URL, OIDC_REQUIRED_GROUP
- **Secrets note:** Client secret value must be stored in `~/.secrets/.env` only, not in this repo
- **Next steps:** Install npm packages, configure env vars on production server, rebuild/redeploy Docker image
