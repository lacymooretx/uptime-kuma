// useFleet: load monitors + their last-24h beats, derive Pulse's per-monitor view
// model (status / uptime% / avg latency / sampled beat strip) and fleet rollups.

import { useEffect, useState } from "react";
import {
  fetchMonitors,
  fetchBeats,
  type ApiMonitor,
  type ApiBeat,
} from "../lib/api";
import type { Monitor, Status, BeatStatus, HeatRow } from "../data/fixtures";

export type FleetData = {
  monitors: Monitor[];
  fleetHealth: number;
  up: number;
  down: number;
  degraded: number;
  total: number;
  p95: number;
  oldestDownSeconds: number | null;
  heatmap: HeatRow[];
  healthSpark: number[];
  latencySpark: number[];
};

export type FleetState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: FleetData };

const beatStripLength = 30;

function statusFromBeat(b: ApiBeat | undefined): BeatStatus {
  if (!b) return "unknown";
  if (b.status === 1) return "up";
  if (b.status === 0) return "down";
  if (b.status === 3) return "maint";
  return "unknown";
}

function rollupStatus(beats: ApiBeat[]): Status {
  if (beats.length === 0) return "up";
  const latest = beats[beats.length - 1];
  if (latest.status === 0) return "down";
  if (latest.status === 3) return "maint";
  // Degraded heuristic: latest is up but recent ping p95 > 2× p50.
  const recent = beats.slice(-30).map((b) => Number(b.ping)).filter((p) => Number.isFinite(p));
  if (recent.length >= 5) {
    const sorted = [...recent].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    if (p50 > 0 && p95 > p50 * 2.5 && p95 > 250) return "degraded";
  }
  return "up";
}

function sampleBeats(beats: ApiBeat[], n: number): BeatStatus[] {
  if (beats.length === 0) return Array(n).fill("unknown");
  // Spread the last `min(beats.length, …)` beats across n slots, taking the
  // worst status in each bucket so a single failure isn't washed out.
  const out: BeatStatus[] = [];
  for (let i = 0; i < n; i++) {
    const lo = Math.floor((i * beats.length) / n);
    const hi = Math.max(lo + 1, Math.floor(((i + 1) * beats.length) / n));
    const slice = beats.slice(lo, hi);
    let worst: BeatStatus = "up";
    for (const b of slice) {
      const s = statusFromBeat(b);
      if (s === "down") { worst = "down"; break; }
      if (s === "unknown" && worst === "up") worst = "unknown";
      if (s === "maint" && worst === "up") worst = "maint";
    }
    out.push(worst);
  }
  return out;
}

function frameworkFromType(m: ApiMonitor): string {
  if (m.tags.length > 0) return m.tags[0].name.toLowerCase();
  return m.type;
}

function regionFromMonitor(m: ApiMonitor): string {
  if (m.tags.length > 1) return m.tags[1].name.toLowerCase();
  if (m.hostname) return m.hostname.split(".").slice(-2).join(".");
  return m.type;
}

function envFromTags(m: ApiMonitor): "prod" | "staging" | "dev" {
  for (const t of m.tags) {
    const n = t.name.toLowerCase();
    if (n.includes("prod")) return "prod";
    if (n.includes("staging") || n.includes("stage")) return "staging";
    if (n.includes("dev")) return "dev";
  }
  return "prod";
}

function avgPing(beats: ApiBeat[]): number {
  const pings = beats.slice(-30).map((b) => Number(b.ping)).filter((p) => Number.isFinite(p) && p > 0);
  if (pings.length === 0) return 0;
  return Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
}

function uptimePercent(beats: ApiBeat[]): number {
  if (beats.length === 0) return 100;
  const up = beats.filter((b) => b.status === 1 || b.status === 3).length;
  return Math.round((up / beats.length) * 10000) / 100;
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]);
}

function adapt(api: ApiMonitor, beats: ApiBeat[]): Monitor {
  const status = rollupStatus(beats);
  return {
    slug: String(api.id),
    name: api.name,
    framework: frameworkFromType(api),
    region: regionFromMonitor(api),
    env: envFromTags(api),
    checks: 1,
    status,
    uptime30d: uptimePercent(beats),
    latencyMs: avgPing(beats),
    url: api.url || (api.hostname ? `${api.hostname}${api.port ? ":" + api.port : ""}` : undefined),
    beats: sampleBeats(beats, beatStripLength),
    tags: api.tags.map((t) => t.name),
  };
}

// Latency heatmap over the last 24h: 5 latency buckets × 24 hourly columns.
// Cell intensity (0-1) = share of that hour's beats whose ping fell in the
// bucket's band. Built from the raw beats useFleet already loaded — no extra
// fetch. Empty when there are no beats.
const HEAT_BANDS: { label: string; min: number; max: number }[] = [
  { label: "1s+", min: 1000, max: Infinity },
  { label: "500ms", min: 500, max: 1000 },
  { label: "250ms", min: 250, max: 500 },
  { label: "100ms", min: 100, max: 250 },
  { label: "50ms", min: 0, max: 100 },
];

function buildHeatmap(allBeats: ApiBeat[]): HeatRow[] {
  const now = Date.now();
  const cols = 24;
  // hourBuckets[h] = array of pings for that hour column (0 = 23h ago … 23 = now)
  const hourPings: number[][] = Array.from({ length: cols }, () => []);
  for (const b of allBeats) {
    const ping = Number(b.ping);
    if (!Number.isFinite(ping) || ping <= 0) continue;
    const ageHours = (now - new Date(b.time).getTime()) / 3_600_000;
    if (ageHours < 0 || ageHours >= cols) continue;
    const col = cols - 1 - Math.floor(ageHours);
    hourPings[col].push(ping);
  }
  return HEAT_BANDS.map((band) => ({
    label: band.label,
    values: hourPings.map((pings) => {
      if (pings.length === 0) return 0;
      const inBand = pings.filter((p) => p >= band.min && p < band.max).length;
      return Math.round((inBand / pings.length) * 100) / 100;
    }),
  }));
}

// Downsample a time-ordered series into `n` averaged buckets, normalized 0-1
// against the series max — used for the KPI sparklines.
function sparkline(values: number[], n = 17): number[] {
  if (values.length === 0) return Array(n).fill(0);
  const max = Math.max(...values, 1);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const lo = Math.floor((i * values.length) / n);
    const hi = Math.max(lo + 1, Math.floor(((i + 1) * values.length) / n));
    const slice = values.slice(lo, hi);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    out.push(Math.round((avg / max) * 100) / 100);
  }
  return out;
}

function pickFleetSubset(api: ApiMonitor[], n: number): ApiMonitor[] {
  // Skip groups (type==='group'), inactive, and child duplicates. Sort by status
  // pessimism (downs first) then by name.
  return api
    .filter((m) => m.type !== "group" && m.active)
    .slice(0, n);
}

const FLEET_LIMIT = 24; // max monitors to fetch beats for on Overview render

export function useFleet(): FleetState {
  const [state, setState] = useState<FleetState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api = await fetchMonitors();
        const subset = pickFleetSubset(api, FLEET_LIMIT);
        const beatsPerMonitor = await Promise.all(
          subset.map(async (m) => {
            try {
              return await fetchBeats(m.id, 24);
            } catch {
              return [] as ApiBeat[];
            }
          }),
        );
        if (cancelled) return;

        const monitors: Monitor[] = subset.map((m, i) => adapt(m, beatsPerMonitor[i]));

        const total = api.filter((m) => m.type !== "group").length;
        const up = monitors.filter((m) => m.status === "up").length;
        const down = monitors.filter((m) => m.status === "down").length;
        const degraded = monitors.filter((m) => m.status === "degraded").length;
        const fleetHealth = monitors.length === 0
          ? 100
          : Math.round(
              (monitors.reduce((s, m) => s + m.uptime30d, 0) / monitors.length) * 100,
            ) / 100;
        const allBeats = beatsPerMonitor.flat();
        const allRecentPings = allBeats
          .map((b) => Number(b.ping))
          .filter((p) => Number.isFinite(p) && p > 0);
        const fleetP95 = p95(allRecentPings);

        // Time-ordered beats for the sparklines (fleet-wide).
        const ordered = [...allBeats].sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
        );
        const latencySpark = sparkline(
          ordered.map((b) => Number(b.ping)).filter((p) => Number.isFinite(p) && p > 0),
        );
        // Health spark = rolling up-rate across the ordered beats.
        const healthSpark = sparkline(
          ordered.map((b) => (b.status === 1 || b.status === 3 ? 1 : 0)),
        );

        setState({
          kind: "ready",
          data: {
            monitors,
            fleetHealth,
            up,
            down,
            degraded,
            total,
            p95: fleetP95,
            oldestDownSeconds: null,
            heatmap: buildHeatmap(allBeats),
            healthSpark,
            latencySpark,
          },
        });
      } catch (e) {
        if (cancelled) return;
        setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
