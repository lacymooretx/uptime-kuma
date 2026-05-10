// Typed REST API client for /api/v1. Auth is handled by apiFetch in lib/auth.ts.

import { apiFetch } from "./auth";

// --- Server response shapes (subset of what /api/v1 returns) ---

/** Monitor as returned by /api/v1/monitors and /api/v1/monitors/:id. */
export interface ApiMonitor {
  id: number;
  name: string;
  type: string;
  active: boolean;
  interval: number;
  url: string | null;
  hostname: string | null;
  port: number | null;
  description: string | null;
  tags: ApiTag[];
  parent: number | null;
  pathName: string;
}

export interface ApiTag {
  id: number;
  name: string;
  color: string;
}

/** Heartbeat. status: 1=UP, 0=DOWN, 2=PENDING, 3=MAINTENANCE. */
export interface ApiBeat {
  id: number;
  monitor_id: number;
  status: 0 | 1 | 2 | 3;
  msg: string;
  time: string; // ISO
  ping: string | number | null; // ms
  important: boolean;
  down_count: number;
  retries: number;
}

interface Envelope<T> {
  ok: true;
  data: T;
}

// --- Endpoint wrappers ---

export async function fetchMonitors(): Promise<ApiMonitor[]> {
  const env = await apiFetch<Envelope<Record<string, ApiMonitor>>>("/api/v1/monitors");
  return Object.values(env.data);
}

export async function fetchBeats(id: number, hours = 24): Promise<ApiBeat[]> {
  const env = await apiFetch<Envelope<ApiBeat[]>>(`/api/v1/monitors/${id}/beats?hours=${hours}`);
  return env.data;
}

export interface ChartPoint {
  up: number;
  down: number;
  avgPing: number;
  minPing: number;
  maxPing: number;
  timestamp: number; // unix seconds
}

export async function fetchChart(id: number, period = 24): Promise<ChartPoint[]> {
  const env = await apiFetch<Envelope<ChartPoint[]>>(`/api/v1/monitors/${id}/chart?period=${period}`);
  return env.data;
}

export interface ImportantHeartbeat {
  monitorID: number;
  status: 0 | 1 | 2 | 3;
  time: string; // "YYYY-MM-DD HH:mm:ss"
  msg: string;
  ping: string | number | null;
  important: true;
  duration: number;
  retries: number;
  response: unknown;
}

export async function fetchImportantHeartbeats(id: number, count = 25): Promise<ImportantHeartbeat[]> {
  const env = await apiFetch<Envelope<ImportantHeartbeat[]>>(
    `/api/v1/monitors/${id}/important-heartbeats?count=${count}`,
  );
  return env.data;
}

export async function fetchMonitor(id: number): Promise<ApiMonitor> {
  const env = await apiFetch<Envelope<ApiMonitor>>(`/api/v1/monitors/${id}`);
  return env.data;
}

export interface ApiStatusPage {
  id: number;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  theme?: string;
  published?: boolean;
  domainNameList?: string[];
}

export async function fetchStatusPages(): Promise<ApiStatusPage[]> {
  const env = await apiFetch<Envelope<ApiStatusPage[]>>("/api/v1/status-pages");
  return env.data;
}

export async function fetchStatusPage(slug: string): Promise<ApiStatusPage> {
  const env = await apiFetch<Envelope<ApiStatusPage>>(`/api/v1/status-pages/${slug}`);
  return env.data;
}
