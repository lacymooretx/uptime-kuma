# Pulse UI Deployment

How the new dashboard (Pulse) plugs into the existing Uptime Kuma server.

## Topology

```
                 ┌────────────────────────────────────────┐
   browser  ───▶ │  uptime.aspendora.com (Express)        │
                 │   ├── /              → Vue 2 app (dist) │
                 │   ├── /v2/*          → Pulse (pulse-ui/dist)
                 │   ├── /auth/oidc/*   → Entra ID flow    │
                 │   ├── /api/v1/*      → REST API         │
                 │   └── /socket.io     → live updates     │
                 └────────────────────────────────────────┘
```

Same origin, same auth, same backend. The two UIs live side-by-side; users can pick.

## Authentication flow (Entra ID)

1. User visits `/v2/overview` (or any Pulse route).
2. `RequireAuth` finds no JWT in `localStorage` → bounces to `/v2/login`.
3. The login page links to `/auth/oidc/login?return=/v2/`.
4. OIDC router stores `oidc_return` cookie alongside `oidc_nonce` / `oidc_state`, redirects to Entra ID.
5. After Microsoft auth, callback validates state, checks `OIDC_REQUIRED_GROUP`, mints a JWT, and redirects to `/v2/?token=…`.
6. Pulse boots, `readTokenFromUrl()` extracts the token, stashes it in `localStorage`, strips it from the URL bar.
7. All subsequent `apiFetch()` calls include `Authorization: Bearer <jwt>` against `/api/v1/*`.

The classic Vue UI continues to receive `?token=` at `/dashboard` exactly as before; the return path is allowlisted server-side so it can only redirect to `/dashboard` or `/v2/`.

### Server changes

`server/routers/oidc-router.js`:
- Added `RETURN_PATH_ALLOWLIST = [ "/dashboard", "/v2/", "/v2" ]`.
- `/auth/oidc/login` accepts `?return=<path>`, validates against the allowlist, stores in an `oidc_return` cookie.
- `/auth/oidc/callback` reads that cookie and redirects to `<return>?token=<jwt>` instead of hard-coded `/dashboard`.
- Anything outside the allowlist falls back to `/dashboard` — open-redirect-safe.

`server/server.js`:
- Mounts `pulse-ui/dist` at `/v2` with an SPA fallback (`/v2/*` → `index.html`) so React Router can handle client-side routing.
- Mount is conditional: if `pulse-ui/dist` doesn't exist (e.g. Pulse hasn't been built), the server starts normally and just logs that the `/v2` mount was skipped.

### Pulse changes

`pulse-ui/src/lib/auth.ts`:
- `readTokenFromUrl()`, `getToken()`, `clearToken()`, `loginUrl()`, `apiFetch()`.
- 401 from any `apiFetch` clears the token and bounces to `/auth/oidc/login`.

`pulse-ui/src/components/RequireAuth.tsx`:
- Wraps protected routes; reads the token from URL on first mount; redirects to `/login` if missing.
- Bypassed entirely when `import.meta.env.DEV` so `npm run dev` keeps working with mock fixtures.

`pulse-ui/vite.config.ts`:
- `base: "/v2/"` for production builds; `"/"` for dev.
- Optional dev proxy: `PULSE_BACKEND=http://localhost:3001 npm run dev` forwards `/auth`, `/api`, and `/socket.io` to a live Uptime Kuma server.

`pulse-ui/src/main.tsx`:
- Sets `BrowserRouter basename` from `import.meta.env.BASE_URL` so all routes resolve under `/v2/` in production.

## Build & deploy

```bash
# 1. Build the Pulse bundle (one-time per release)
cd pulse-ui
npm install
npm run build           # → pulse-ui/dist/

# 2. Restart the Uptime Kuma server. It auto-detects pulse-ui/dist
#    and mounts it at /v2/. Look for the line:
#    "Pulse UI mounted at /v2 from pulse-ui/dist"
cd ..
npm run start-server    # or whatever your prod start cmd is
```

For production deployment to the Vultr Proxmox Docker host (VM 300, `10.10.30.174`, reached via `pve-dal-01` jump host):
1. The Dockerfile has a multi-stage build that compiles `pulse-ui/` inside the image — no need to pre-build locally.
2. rsync the source tree (server/, src/, pulse-ui/, Dockerfile) to `/opt/services/uptime-kuma/source/` on the Docker host.
3. `docker compose build && docker compose up -d` from `/opt/services/uptime-kuma/`.
4. No env-var changes required — OIDC vars in `.env` are reused.

```bash
# from this repo's root
rsync -avz --delete \
  --exclude node_modules --exclude .git --exclude data --exclude pulse-ui/dist \
  -e 'ssh -J pve-dal-01' \
  ./ root@10.10.30.174:/opt/services/uptime-kuma/source/

ssh -J pve-dal-01 root@10.10.30.174 '
  cd /opt/services/uptime-kuma &&
  docker compose build &&
  docker compose up -d
'
```

## Verification

- Visit `https://uptime.aspendora.com/v2/` — should redirect to Pulse login.
- Click "Sign in with Microsoft" → Entra prompt → returns to `/v2/overview` with token attached.
- Inspect localStorage: `pulse.jwt` is set.
- Inspect Network: `/api/v1/*` calls have `Authorization: Bearer …`.
- Open the classic UI at `https://uptime.aspendora.com/` — still works, JWT issued there is unchanged.

## Rollback

`pulse-ui/dist/` is the only artifact. To disable Pulse without code changes:
- `rm -rf pulse-ui/dist` and restart — the `/v2` mount is skipped.

To remove the integration entirely, revert the OIDC router change and the `/v2` mount block in `server/server.js`. Pulse keeps working as a standalone Vite app.

## Source notes
- OIDC router origin: see `server/routers/oidc-router.js` (commit `70347713` introduced OIDC).
- Bootstrap API key (separate concern — service-to-service): `UPTIME_KUMA_BOOTSTRAP_API_KEY` per commit `28d4a586`.
