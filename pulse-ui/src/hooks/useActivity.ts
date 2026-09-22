// useActivity: build the Overview "Activity feed" from real important-heartbeats
// across all monitors. Read-only — same /api/v1 surface the Incidents page uses.
// Important beats are Kuma's own state-change log, so this is the genuine feed of
// what went down / recovered / entered maintenance, newest first.

import { useEffect, useState } from "react";
import {
  fetchMonitors,
  fetchImportantHeartbeats,
  type ImportantHeartbeat,
} from "../lib/api";
import type { ActivityEvent, EventType } from "../data/fixtures";

export type ActivityState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; events: ActivityEvent[] };

const MONITOR_LIMIT = 40; // cap fan-out of per-monitor beat fetches
const FEED_LIMIT = 8;

function fmtAgo(d: Date): string {
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function eventType(status: ImportantHeartbeat["status"]): EventType {
  if (status === 0) return "down";
  if (status === 3) return "maint";
  return "recovered"; // status 1 (up) important beat = recovered from a prior down
}

function title(monitor: string, type: EventType): string {
  switch (type) {
    case "down":
      return `${monitor} went DOWN`;
    case "recovered":
      return `${monitor} recovered`;
    case "maint":
      return `${monitor} entered maintenance`;
    default:
      return monitor;
  }
}

export function useActivity(): ActivityState {
  const [state, setState] = useState<ActivityState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const monitors = (await fetchMonitors())
          .filter((m) => m.type !== "group" && m.active)
          .slice(0, MONITOR_LIMIT);
        const perMonitor = await Promise.all(
          monitors.map(async (m) => {
            try {
              return {
                name: m.name,
                beats: await fetchImportantHeartbeats(m.id, 10),
              };
            } catch {
              return { name: m.name, beats: [] as ImportantHeartbeat[] };
            }
          }),
        );
        if (cancelled) return;

        const events: ActivityEvent[] = perMonitor
          .flatMap(({ name, beats }) =>
            beats.map((b) => {
              const type = eventType(b.status);
              const when = new Date(b.time);
              return {
                id: `${name}-${b.time}`,
                type,
                title: title(name, type),
                detail: (b.msg || "").split("\n")[0].slice(0, 80) || "—",
                ago: fmtAgo(when),
                _t: when.getTime(),
              };
            }),
          )
          .sort((a, b) => b._t - a._t)
          .slice(0, FEED_LIMIT)
          .map(({ _t, ...e }) => e);

        setState({ kind: "ready", events });
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
