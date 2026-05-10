// useMonitor: fetches everything Monitor Detail needs in one shot.
import { useEffect, useState } from "react";
import {
  fetchMonitor,
  fetchBeats,
  fetchChart,
  fetchImportantHeartbeats,
  type ApiMonitor,
  type ApiBeat,
  type ChartPoint,
  type ImportantHeartbeat,
} from "../lib/api";

export type MonitorView = {
  monitor: ApiMonitor;
  beats: ApiBeat[];
  chart: ChartPoint[];
  important: ImportantHeartbeat[];

  // Derived
  status: "up" | "down" | "degraded" | "maint";
  uptimePct: number;
  mttrSec: number | null;
  p50: number;
  p95: number;
  p99: number;
  latencyBars: { h: number; tone: "ok" | "slow" | "error" }[];
  thirtyDay: ("up" | "warn" | "down" | "maint")[];
  incidents: {
    id: string;
    status: "ACTIVE" | "RESOLVED" | "MAINT";
    title: string;
    meta: string;
    duration: string;
    highlight?: boolean;
  }[];
};

export type MonitorState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: MonitorView };

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return Math.round(sorted[idx]);
}

function buildLatencyBars(chart: ChartPoint[]): MonitorView["latencyBars"] {
  // Use last 60 minute-buckets if available, else what we have.
  const last = chart.slice(-60);
  if (last.length === 0) return [];
  const max = Math.max(...last.map((p) => p.maxPing || p.avgPing || 0), 1);
  return last.map((p) => {
    const errored = p.down > 0 && p.up === 0;
    const elevated = p.avgPing > max * 0.5 && !errored;
    const h = errored ? Math.max(0.05, 0.08 + Math.random() * 0.03) : Math.min(0.95, p.avgPing / max);
    return { h, tone: errored ? "error" : elevated ? "slow" : "ok" };
  });
}

function buildThirtyDay(beats: ApiBeat[], days = 30): MonitorView["thirtyDay"] {
  const out: MonitorView["thirtyDay"] = Array(days).fill("up");
  if (beats.length === 0) return out;
  const oldest = new Date(beats[0].time).getTime();
  const newest = new Date(beats[beats.length - 1].time).getTime();
  const span = Math.max(1, newest - oldest);
  for (const b of beats) {
    const t = new Date(b.time).getTime();
    const idx = Math.min(days - 1, Math.max(0, Math.floor(((t - oldest) / span) * days)));
    if (b.status === 0) out[idx] = "down";
    else if (b.status === 3 && out[idx] === "up") out[idx] = "maint";
    else if (out[idx] === "up" && Number(b.ping) > 500) out[idx] = "warn";
  }
  return out;
}

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function fmtAgo(date: Date): string {
  const now = Date.now();
  const sec = Math.floor((now - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function buildIncidents(important: ImportantHeartbeat[]): MonitorView["incidents"] {
  // Important-heartbeats come newest-first. We pair status=0 (down) entries with the
  // next chronologically-newer status=1 (up) entry to form an incident with duration.
  // Status=3 (maint) gets its own entry.
  const sorted = [...important].sort((a, b) =>
    new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  const incidents: MonitorView["incidents"] = [];
  let openDown: ImportantHeartbeat | null = null;
  for (const beat of sorted) {
    const t = new Date(beat.time);
    if (beat.status === 0) {
      openDown = beat;
    } else if (beat.status === 1 && openDown) {
      const start = new Date(openDown.time);
      const dur = Math.floor((t.getTime() - start.getTime()) / 1000);
      const firstLine = (openDown.msg || "").split("\n")[0].slice(0, 80);
      incidents.push({
        id: openDown.time,
        status: "RESOLVED",
        title: firstLine || "Down",
        meta: `${fmtAgo(start)} · MTTR ${fmtDuration(dur)} · auto-recovered`,
        duration: fmtDuration(dur),
      });
      openDown = null;
    } else if (beat.status === 3) {
      incidents.push({
        id: beat.time,
        status: "MAINT",
        title: "Maintenance window",
        meta: `${fmtAgo(t)} · alerts suppressed`,
        duration: "—",
      });
    }
  }
  if (openDown) {
    const start = new Date(openDown.time);
    const dur = Math.floor((Date.now() - start.getTime()) / 1000);
    const firstLine = (openDown.msg || "").split("\n")[0].slice(0, 80);
    incidents.push({
      id: openDown.time,
      status: "ACTIVE",
      title: firstLine || "Down",
      meta: `started ${fmtAgo(start)}`,
      duration: fmtDuration(dur),
      highlight: true,
    });
  }
  // Newest first
  return incidents.reverse().slice(0, 8);
}

export function useMonitor(id: number | null): MonitorState {
  const [state, setState] = useState<MonitorState>({ kind: "loading" });

  useEffect(() => {
    if (id === null || Number.isNaN(id)) {
      setState({ kind: "error", message: "Invalid monitor id" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [monitor, beats24, chart, important] = await Promise.all([
          fetchMonitor(id),
          fetchBeats(id, 24 * 30), // 30 days
          fetchChart(id, 24),
          fetchImportantHeartbeats(id, 25),
        ]);
        if (cancelled) return;

        const pings = beats24.map((b) => Number(b.ping)).filter((p) => Number.isFinite(p) && p > 0);
        const upCount = beats24.filter((b) => b.status === 1 || b.status === 3).length;
        const uptimePct = beats24.length === 0 ? 100 : Math.round((upCount / beats24.length) * 10000) / 100;

        const last = beats24[beats24.length - 1];
        let status: MonitorView["status"] = "up";
        if (last) {
          if (last.status === 0) status = "down";
          else if (last.status === 3) status = "maint";
          else {
            const p = quantile(pings.slice(-30), 0.95);
            const med = quantile(pings.slice(-30), 0.5);
            if (med > 0 && p > med * 2.5 && p > 250) status = "degraded";
          }
        }

        // MTTR: average duration of resolved (down→up) pairs in the last 30 days.
        const mttrPairs: number[] = [];
        const sortedImp = [...important].sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
        );
        let openDown: ImportantHeartbeat | null = null;
        for (const b of sortedImp) {
          if (b.status === 0) openDown = b;
          else if (b.status === 1 && openDown) {
            mttrPairs.push(
              (new Date(b.time).getTime() - new Date(openDown.time).getTime()) / 1000,
            );
            openDown = null;
          }
        }
        const mttrSec = mttrPairs.length === 0
          ? null
          : Math.round(mttrPairs.reduce((a, b) => a + b, 0) / mttrPairs.length);

        setState({
          kind: "ready",
          data: {
            monitor,
            beats: beats24,
            chart,
            important,
            status,
            uptimePct,
            mttrSec,
            p50: quantile(pings, 0.5),
            p95: quantile(pings, 0.95),
            p99: quantile(pings, 0.99),
            latencyBars: buildLatencyBars(chart),
            thirtyDay: buildThirtyDay(beats24),
            incidents: buildIncidents(important),
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
  }, [id]);

  return state;
}

export function fmtMttr(sec: number | null): string {
  if (sec === null) return "—";
  return fmtDuration(sec);
}
