# Pulse UI

Reference React + Tailwind v4 implementation of the Pulse dashboard concept for Uptime Kuma. Designed in `pencil-welcome-desktop.pen`, translated to runnable code here. All data is mocked in `src/data/fixtures.ts` — no backend.

## Run

```bash
cd pulse-ui
npm install
npm run dev      # http://localhost:5180/
npm run build    # type-check + production bundle
```

## Routes

- `/overview` — fleet health, KPI strip, service grid, latency heatmap, activity feed
- `/monitors/service-log` — single-monitor deep dive (status pill, latency chart with deploy marker, 30-day strip, incidents, cert)
- `/incidents` — cross-monitor swimlane timeline + active triage cards + resolved list
- `/status-pages/aspendora` — split-pane public status page composer with live preview

## Design tokens

Defined as CSS variables in `src/index.css` under `@theme`. Tailwind v4 auto-generates utility classes from them (`bg-card`, `text-muted-fg`, `bg-success-fg/55`, etc.). Dark mode is the default and only theme.

## Layout

```
src/
  components/
    Layout.tsx              — sidebar + main outlet
    Sidebar.tsx             — nav, search, on-call footer, pinned monitors when on detail
    Topbar.tsx              — breadcrumbs, live pill, action slots
    ui.tsx                  — Button, IconButton, Tag, Card, Avatar, StatLabel
    KpiCard.tsx             — stat tile + Sparkline subcomponent
    BeatStrip.tsx           — N-segment status strip; collapses to a single bar when all green
    ServiceTile.tsx         — service-rollup tile used on Overview
    LatencyHeatmap.tsx      — 5×24 distribution heatmap
    LatencyChart.tsx        — 60-bar response-time chart with deploy marker
    ThirtyDayStrip.tsx      — daily uptime pills, 30 cells
    ActivityFeed.tsx        — typed event list
    IncidentTriage.tsx      — ActiveIncidentBanner (Overview) + ExpandedIncidentCard (Incidents)
    Swimlane.tsx            — N×7 monitor × day grid
    StatusPagePreview.tsx   — public-facing status page rendered inside a browser-chrome window
  pages/
    Overview.tsx
    MonitorDetail.tsx
    Incidents.tsx
    StatusPageComposer.tsx
  data/
    fixtures.ts             — Monitor[], heatmap, lanes, incidents, activity events
```

## Notes

- **Icons** come from `lucide-react`. The Pencil mockups used Material Symbols; switching to Lucide is a stylistic choice that fits the JetBrains Mono + Geist typography better.
- **Fonts** are loaded from Google Fonts in `index.html`.
- **Empty states / loading / errors** are not implemented — this is a design fidelity demo, not a production app.
- **No backend wiring.** To integrate against Uptime Kuma's REST API (`/api/v1`), replace the imports from `data/fixtures.ts` with fetcher hooks; the component contracts are intentionally close to the existing API shapes.
