// useIncidents: aggregate important-heartbeats across all monitors into a unified
// incident log + 7-day swimlane. Read-only — uses the existing /api/v1 surface.

import { useEffect, useState } from "react";
import {
  fetchMonitors,
  fetchImportantHeartbeats,
  type ImportantHeartbeat,
} from "../lib/api";
import type { Lane, BeatStatus, Incident } from "../data/fixtures";

export type IncidentsData = {
  active: Incident[];
  resolved: Incident[];
  lanes: Lane[];
  mttrSec: number;
  mtbfHours: number;
  openedLast7d: number;
};

export type IncidentsState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: IncidentsData };

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d`;
}

function fmtAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

const LANE_LIMIT = 24; // monitors to consider for the swimlane

export function useIncidents(): IncidentsState {
  const [state, setState] = useState<IncidentsState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const monitors = (await fetchMonitors())
          .filter((m) => m.type !== "group" && m.active)
          .slice(0, LANE_LIMIT);
        const important = await Promise.all(
          monitors.map(async (m) => {
            try {
              return await fetchImportantHeartbeats(m.id, 30);
            } catch {
              return [] as ImportantHeartbeat[];
            }
          }),
        );
        if (cancelled) return;

        const now = Date.now();
        const sevenDaysAgo = now - 7 * 86_400_000;

        const active: Incident[] = [];
        const resolved: Incident[] = [];
        const mttrPairs: number[] = [];
        let openedLast7d = 0;

        // Build per-monitor swimlane: 7 day-buckets, worst status wins per day.
        const lanes: Lane[] = [];

        for (let i = 0; i < monitors.length; i++) {
          const m = monitors[i];
          const events = [...important[i]].sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          );

          // Pair down→up
          let open: ImportantHeartbeat | null = null;
          for (const ev of events) {
            const t = new Date(ev.time).getTime();
            if (ev.status === 0) {
              open = ev;
              if (t >= sevenDaysAgo) openedLast7d++;
            } else if (ev.status === 1 && open) {
              const start = new Date(open.time);
              const dur = (t - start.getTime()) / 1000;
              mttrPairs.push(dur);
              const firstLine = (open.msg || "").split("\n")[0].slice(0, 80) || "Recovered from down";
              resolved.push({
                id: `${m.id}-${open.time}`,
                monitor: m.name,
                severity: "down",
                message: firstLine,
                status: "resolved",
                startedAgo: fmtAgo(start),
                duration: fmtDuration(Math.round(dur)),
                owner: { initials: "AI", name: "auto", isBot: true },
              });
              open = null;
            }
          }

          // If still open at the end, this monitor is currently down.
          if (open) {
            const start = new Date(open.time);
            const firstLine = (open.msg || "").split("\n")[0].slice(0, 90) || "Down";
            active.push({
              id: `${m.id}-${open.time}`,
              monitor: m.name,
              severity: "down",
              message: firstLine,
              status: "active",
              startedAgo: fmtDuration(Math.floor((now - start.getTime()) / 1000)),
            });
          }

          // Build 7-day swimlane row for this monitor.
          const days: BeatStatus[] = ["up", "up", "up", "up", "up", "up", "up"];
          for (const ev of events) {
            const t = new Date(ev.time).getTime();
            if (t < sevenDaysAgo) continue;
            const dayIdx = Math.min(6, Math.max(0, Math.floor((t - sevenDaysAgo) / 86_400_000)));
            if (ev.status === 0 && days[dayIdx] !== "down") days[dayIdx] = "down";
            else if (ev.status === 3 && days[dayIdx] === "up") days[dayIdx] = "maint";
          }
          // If active, force today's slot to down
          if (open) days[6] = "down";

          // Only show monitors that had any activity in the last 7 days.
          const hasActivity = days.some((d) => d !== "up");
          if (hasActivity) {
            lanes.push({
              name: m.name,
              status: open ? "down" : "up",
              days,
            });
          }
        }

        const mttrSec = mttrPairs.length === 0
          ? 0
          : Math.round(mttrPairs.reduce((a, b) => a + b, 0) / mttrPairs.length);
        // MTBF: 7d window / number of failures in that window (rough but readable)
        const mtbfHours = openedLast7d === 0 ? 7 * 24 : Math.round((7 * 24) / openedLast7d * 10) / 10;

        // Newest-first for resolved
        resolved.sort((a, b) => (b.id < a.id ? -1 : 1));

        setState({
          kind: "ready",
          data: {
            active,
            resolved: resolved.slice(0, 8),
            lanes: lanes.slice(0, 12),
            mttrSec,
            mtbfHours,
            openedLast7d,
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

export function fmtMttrShort(sec: number): string {
  if (sec === 0) return "—";
  return fmtDuration(sec);
}
