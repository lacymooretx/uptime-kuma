# Multi-User + Entra ID + PostgreSQL Build Progress

## Phase A: Azure/Entra Infrastructure — COMPLETE
- [x] Created App Registration "Uptime Kuma" (App ID: 7cc2cd0c-43f7-4034-b4e0-6c7c02bc9496)
- [x] Configured redirect URI (https://uptime.aspendora.com/auth/oidc/callback)
- [x] Created client secret
- [x] Enabled ID token with group claims (groupMembershipClaims: SecurityGroup)
- [x] Created security group "uptime-kuma" (ID: 1390e60c-b568-4839-9ec9-66cabfd52431)
- [x] Added lacy@aspendora.com and ian@aspendora.com to group
- [x] Created service principal for the app

## Phase B: PostgreSQL Infrastructure — COMPLETE
- [x] Added PostgreSQL 16 container to docker-compose.yml
- [x] Added PostgreSQL support to server/database.js (connection config, pool, init)
- [x] Updated sqlHourOffset() for PostgreSQL: `(NOW() + INTERVAL '1 hour' * ?)`
- [x] Updated getSize() and shrink() for PostgreSQL
- [x] Fixed RedBean ORM for PostgreSQL:
  - Monkey-patched normalizeRaw to unwrap {rows: [...]} result format
  - Monkey-patched getRow(autoLimit) to use `?` binding instead of `$1`
- [x] Fixed SQL identifier quoting: replaced backticks with ANSI double-quotes across 13 files
- [x] Added ANSI_QUOTES mode to MariaDB connection for compatibility
- [x] Rebuilt Docker image with PostgreSQL support
- [x] Deployed with PostgreSQL 16 backend — migrations, tables, JWT all working

## Phase C: Multi-User OIDC Code — COMPLETE
- [x] Created /server/routers/oidc-router.js with openid-client v5
- [x] GET /auth/oidc/status — reports OIDC enabled
- [x] GET /auth/oidc/login — redirects to Entra ID
- [x] GET /auth/oidc/callback — exchanges code, checks group, provisions user, issues JWT
- [x] Mounted OIDC router in server.js with cookie-parser
- [x] Environment variables configured in docker-compose.yml

## Phase D: Verification — COMPLETE
- [x] Server starts with PostgreSQL (no errors)
- [x] https://uptime.aspendora.com responds (302 to dashboard)
- [x] REST API returns proper 401 JSON
- [x] OIDC status endpoint reports `{"oidcEnabled":true}`

## PHASE COMPLETE — awaiting approval to proceed.

Next: Visit https://uptime.aspendora.com to complete initial setup, then test OIDC login flow at https://uptime.aspendora.com/auth/oidc/login

## Phase: Remove all mock data from Pulse UI (2026-07-01)
**Goal:** Every Pulse screen shows real Kuma data; no fixtures render in production.
**Decisions:** no-backend UI (on-call/team/escalation) → honest empty states; Overview service grouping → group by real Kuma tags (Ungrouped bucket for untagged).
**Status:** in progress — see docs/claude-runlog.md for step detail.

**Result (2026-07-01):** DEPLOYED to production. tsc + vite build clean; image rebuilt on VM 300; container recreated healthy; new bundle index-Lfkxdkh2.js live at /v2; DNS fix intact. Every Pulse page now reads real /api/v1 data — remaining non-live UI (on-call/Team, MonitorDetail cert card, Integrations concept cards) shows honest empty states, not fabricated data.
