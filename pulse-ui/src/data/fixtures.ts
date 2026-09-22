// Shared UI type contracts (Monitor, Incident, Lane, HeatRow, …) plus a few
// small dev-only fallbacks used when `npm run dev` runs standalone with no
// backend. Production never renders these — every page reads live /api/v1 data
// via the hooks. Do not add new mock arrays here; wire real data instead.

export type Status = "up" | "degraded" | "down" | "maint";

export type BeatStatus = "up" | "warn" | "down" | "maint" | "unknown";

export type Monitor = {
  slug: string;
  name: string;
  framework: string;
  region: string;
  env: "prod" | "staging" | "dev";
  checks: number;
  status: Status;
  uptime30d: number;
  latencyMs: number;
  beats: BeatStatus[]; // last N
  url?: string;
  tags?: string[]; // real Kuma tag names, for grouping (always set for live data)
};

const greenBeats = (n: number): BeatStatus[] => Array.from({ length: n }, () => "up");

export const monitors: Monitor[] = [
  {
    slug: "service-log",
    name: "servicetracker",
    framework: "asp.net",
    region: "us-east",
    env: "prod",
    checks: 4,
    status: "down",
    uptime30d: 99.31,
    latencyMs: 142,
    url: "https://service-log.3endt.com/health",
    beats: [
      ...greenBeats(26),
      "warn",
      "up",
      "down",
      "down",
      "down",
    ],
  },
  {
    slug: "callqa",
    name: "callqa",
    framework: "asp.net",
    region: "us-east",
    env: "prod",
    checks: 3,
    status: "degraded",
    uptime30d: 99.86,
    latencyMs: 412,
    url: "https://callqa.aspendora.com/health",
    beats: [
      ...greenBeats(17),
      "warn",
      "up",
      "warn",
      "warn",
      "up",
      "warn",
      "warn",
      "warn",
      "warn",
      "warn",
      "warn",
      "warn",
      "warn",
    ],
  },
  {
    slug: "controlr",
    name: "controlr",
    framework: "blazor",
    region: "multi-region",
    env: "prod",
    checks: 6,
    status: "up",
    uptime30d: 100,
    latencyMs: 127,
    url: "https://controlr.aspendora.com/health",
    beats: greenBeats(30),
  },
  {
    slug: "user-management",
    name: "user-management",
    framework: "blazor",
    region: "us-east",
    env: "prod",
    checks: 3,
    status: "up",
    uptime30d: 99.99,
    latencyMs: 89,
    beats: greenBeats(30),
  },
  {
    slug: "infodex",
    name: "infodex",
    framework: "node",
    region: "docker",
    env: "prod",
    checks: 5,
    status: "up",
    uptime30d: 99.97,
    latencyMs: 203,
    beats: greenBeats(30),
  },
  {
    slug: "people-directory",
    name: "people-directory",
    framework: "asp.net",
    region: "us-west",
    env: "prod",
    checks: 3,
    status: "up",
    uptime30d: 99.94,
    latencyMs: 156,
    beats: greenBeats(30),
  },
  {
    slug: "aspendora-console",
    name: "aspendora-console",
    framework: "fastapi",
    region: "us-east",
    env: "prod",
    checks: 4,
    status: "up",
    uptime30d: 99.99,
    latencyMs: 94,
    beats: greenBeats(30),
  },
  {
    slug: "ticket-auditor",
    name: "ticket-auditor",
    framework: "python",
    region: "oauth-proxy",
    env: "prod",
    checks: 2,
    status: "up",
    uptime30d: 99.42,
    latencyMs: 312,
    beats: greenBeats(30),
  },
];

export const fleetStats = {
  total: 47,
  up: 43,
  degraded: 2,
  down: 2,
  fleetHealth: 98.42,
  fleetHealthDelta: -0.18,
  p95: 247,
  p95Delta: 38,
  oldestDownSeconds: 442,
};

export type EventType = "down" | "degraded" | "recovered" | "maint" | "added" | "published";

export type ActivityEvent = {
  id: string;
  type: EventType;
  title: string;
  detail: string;
  ago: string;
};

// Activity feed event shape. Live data comes from useActivity (important
// heartbeats); this type is the shared contract.
// (no mock array — the feed is built from real /api/v1 data)

// Latency heatmap row: bucket label + 24 hourly intensity cells (0-1).
// Built live from real beats in useFleet; this type is the shared contract.
export type HeatRow = { label: string; values: number[] };

// Monitor Detail latency chart (60 minutes of bars).
// Each bar: heightFraction (0-1) and tone.
export type LatencyBar = { h: number; tone: "ok" | "slow" | "error" };

const stable = Array.from({ length: 32 }, (_, i): LatencyBar => ({
  h: 0.24 + Math.sin(i * 0.4) * 0.08 + (i / 32) * 0.18,
  tone: "ok",
}));
const rising = Array.from({ length: 15 }, (_, i): LatencyBar => ({
  h: 0.45 + (i / 15) * 0.5,
  tone: "slow",
}));
const errors = Array.from({ length: 13 }, (): LatencyBar => ({
  h: 0.04 + Math.random() * 0.05,
  tone: "error",
}));
export const latencyBars: LatencyBar[] = [...stable, ...rising, ...errors];

// 30-day daily uptime strip
export type DayState = "up" | "warn" | "down" | "maint";
export const last30Days: DayState[] = [
  "up", "up", "up", "up", "warn", "up", "up", "up", "up", "up",
  "down", "up", "up", "up", "up", "up", "maint", "up", "up", "up",
  "warn", "up", "up", "up", "up", "up", "up", "warn", "up", "down",
];

// Incidents data for the Incidents page
export type Incident = {
  id: string;
  monitor: string;
  severity: "down" | "slow" | "maint";
  message: string;
  status: "active" | "resolved" | "acked";
  startedAgo: string;
  duration?: string;
  owner?: { initials: string; name: string; isBot?: boolean };
};

// Incidents are built live from important heartbeats in useIncidents; the
// Incident type above is the shared contract (no mock arrays).

// Swimlane data (8 monitors x 7 days)
export type Lane = { name: string; status: BeatStatus; days: BeatStatus[] };

export const lanes: Lane[] = [
  { name: "service-log", status: "down", days: ["up", "up", "warn", "up", "up", "up", "down"] },
  { name: "callqa", status: "warn", days: ["up", "up", "up", "up", "warn", "warn", "warn"] },
  { name: "defiant2-proxy", status: "up", days: ["up", "up", "down", "up", "up", "up", "up"] },
  { name: "controlr", status: "up", days: ["up", "up", "up", "up", "up", "maint", "up"] },
  { name: "infodex", status: "up", days: ["up", "up", "up", "down", "up", "up", "up"] },
  { name: "people-directory", status: "up", days: ["up", "down", "up", "up", "up", "up", "up"] },
  { name: "ticket-auditor", status: "up", days: ["warn", "up", "up", "up", "warn", "up", "up"] },
  { name: "user-management", status: "up", days: ["up", "up", "up", "up", "up", "up", "maint"] },
];
