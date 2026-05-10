// Mock data shaped after the .pen mockups. Pure data; no real network calls.

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
  oncall: { initials: "LM", name: "Lacy Moore", remainingMinutes: 252, escalateMinutes: 14 },
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

export const activity: ActivityEvent[] = [
  { id: "e1", type: "down", title: "service-log went DOWN", detail: "HTTP 500 · keyword match “An error occurred”", ago: "7m" },
  { id: "e2", type: "degraded", title: "callqa latency degraded", detail: "p95 412ms · threshold 300ms · 3 consecutive", ago: "22m" },
  { id: "e3", type: "recovered", title: "defiant2-proxy recovered", detail: "down 4m · auto-restart resolved · MTTR 4m 12s", ago: "1h" },
  { id: "e4", type: "maint", title: "Maintenance window started", detail: "infra-team · cert renewal · 30m planned", ago: "2h" },
  { id: "e5", type: "added", title: "New monitor: imtec-sql-ip", detail: "keyword check · added by lacy@aspendora.com", ago: "5h" },
  { id: "e6", type: "published", title: "Status page published", detail: "status.aspendora.com · 7 services exposed", ago: "6h" },
];

// Latency heatmap. 5 rows (latency buckets) x 24 cols (hours).
// Values 0-1 representing intensity. Last column = "now" with the latency spike.
export type HeatRow = { label: string; values: number[] };

export const heatmap: HeatRow[] = [
  {
    label: "1s+",
    values: [
      0.1, 0.05, 0.05, 0.08, 0.1, 0.05, 0.05, 0.05, 0.05, 0.08, 0.1, 0.12, 0.15, 0.1, 0.15, 0.18,
      0.22, 0.3, 0.4, 0.55, 0.7, 0.85, 0.95, 0.98,
    ],
  },
  {
    label: "500ms",
    values: [
      0.18, 0.2, 0.22, 0.25, 0.22, 0.2, 0.25, 0.3, 0.32, 0.3, 0.28, 0.3, 0.32, 0.35, 0.4, 0.45,
      0.55, 0.6, 0.65, 0.7, 0.8, 0.85, 0.92, 0.95,
    ],
  },
  {
    label: "250ms",
    values: [
      0.4, 0.45, 0.5, 0.55, 0.5, 0.55, 0.6, 0.55, 0.6, 0.55, 0.6, 0.65, 0.7, 0.65, 0.7, 0.75, 0.7,
      0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.4,
    ],
  },
  {
    label: "100ms",
    values: [
      0.6, 0.7, 0.8, 0.9, 0.85, 0.9, 0.95, 0.9, 0.95, 0.92, 0.95, 0.85, 0.8, 0.85, 0.8, 0.7, 0.6,
      0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25,
    ],
  },
  {
    label: "50ms",
    values: [
      0.3, 0.4, 0.45, 0.55, 0.6, 0.55, 0.65, 0.7, 0.65, 0.6, 0.7, 0.55, 0.5, 0.45, 0.4, 0.35, 0.4,
      0.35, 0.3, 0.25, 0.3, 0.25, 0.2, 0.18,
    ],
  },
];

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

export const activeIncidents: Incident[] = [
  {
    id: "i1",
    monitor: "service-log.3endt.com",
    severity: "down",
    message: "HTTP 500 · keyword “An error occurred while processing your request” · 3 of last 5 checks failed · pageant alert sent to Lacy at 22:14:58 UTC",
    status: "active",
    startedAgo: "7m 22s",
  },
  {
    id: "i2",
    monitor: "callqa.aspendora.com",
    severity: "slow",
    message: "p95 latency 412ms exceeds threshold 300ms · 3 consecutive checks · acked by Lacy 14m ago",
    status: "acked",
    startedAgo: "22m 04s",
    owner: { initials: "LM", name: "Lacy" },
  },
];

export const resolvedIncidents: Incident[] = [
  {
    id: "r1",
    monitor: "defiant2-proxy",
    severity: "down",
    message: "Connection refused",
    status: "resolved",
    startedAgo: "3d ago",
    duration: "4m 12s",
    owner: { initials: "RC", name: "Riley" },
  },
  {
    id: "r2",
    monitor: "ticket-auditor",
    severity: "slow",
    message: "p95 latency over threshold for 8m",
    status: "resolved",
    startedAgo: "3d ago",
    duration: "8m 04s",
    owner: { initials: "LM", name: "Lacy" },
  },
  {
    id: "r3",
    monitor: "infodex",
    severity: "down",
    message: "OnlyOffice container OOM-killed · auto-restart",
    status: "resolved",
    startedAgo: "4d ago",
    duration: "2m 31s",
    owner: { initials: "AI", name: "auto", isBot: true },
  },
  {
    id: "r4",
    monitor: "controlr",
    severity: "maint",
    message: "Database migration · planned · alerts suppressed",
    status: "resolved",
    startedAgo: "5d ago",
    duration: "22m",
    owner: { initials: "RC", name: "Riley" },
  },
  {
    id: "r5",
    monitor: "people-directory",
    severity: "down",
    message: "HTTP 502 · upstream timeout",
    status: "resolved",
    startedAgo: "6d ago",
    duration: "6m 18s",
    owner: { initials: "LM", name: "Lacy" },
  },
];

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
