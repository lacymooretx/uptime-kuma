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

/** Per-monitor entry from /api/v1/monitors/summary. uptime24h is a 0-1 ratio. */
export interface ApiMonitorSummary {
  beats: ApiBeat[]; // most recent N, oldest first
  uptime24h: number | null;
  avgPing24h: number | null;
}

export async function fetchMonitorSummary(count = 30): Promise<Record<string, ApiMonitorSummary>> {
  const env = await apiFetch<Envelope<Record<string, ApiMonitorSummary>>>(
    `/api/v1/monitors/summary?count=${count}`,
  );
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

export interface ApiMaintenance {
  id: number;
  title: string;
  description?: string;
  strategy: string;
  active: boolean;
  intervalDay?: number;
  dateRange?: string[];
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  weekdays?: number[];
  daysOfMonth?: number[];
  timezone?: string;
}

export async function fetchMaintenance(): Promise<ApiMaintenance[]> {
  // Server returns {[id]: ApiMaintenance} keyed by id (not an array). Normalize.
  const env = await apiFetch<Envelope<Record<string, ApiMaintenance> | ApiMaintenance[]>>(
    "/api/v1/maintenance",
  );
  return Array.isArray(env.data) ? env.data : Object.values(env.data);
}

// Server stores the full provider-specific config as a JSON string in `config`.
// Top-level columns: id, name, active, isDefault. The `type` and provider fields
// (cwApiUrl, slackWebhookUrl, etc.) live inside the parsed config blob.
export interface ApiNotificationRaw {
  id: number;
  name: string;
  active: boolean;
  isDefault: boolean;
  config: string;
}

export interface ApiNotification {
  id: number;
  name: string;
  type: string;
  active: boolean;
  isDefault: boolean;
  config: Record<string, unknown>;
}

function parseNotification(raw: ApiNotificationRaw): ApiNotification {
  let cfg: Record<string, unknown> = {};
  try {
    cfg = raw.config ? JSON.parse(raw.config) : {};
  } catch {
    cfg = {};
  }
  return {
    id: raw.id,
    name: raw.name,
    active: raw.active,
    isDefault: raw.isDefault,
    type: typeof cfg.type === "string" ? cfg.type : "Unknown",
    config: cfg,
  };
}

export async function fetchNotifications(): Promise<ApiNotification[]> {
  const env = await apiFetch<Envelope<ApiNotificationRaw[]>>("/api/v1/notifications");
  return env.data.map(parseNotification);
}

export async function createNotification(body: Record<string, unknown>): Promise<{ id: number }> {
  const env = await apiFetch<Envelope<{ id: number }>>("/api/v1/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return env.data;
}

export async function updateNotification(id: number, body: Record<string, unknown>): Promise<{ id: number }> {
  const env = await apiFetch<Envelope<{ id: number }>>(`/api/v1/notifications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return env.data;
}

export async function deleteNotification(id: number): Promise<void> {
  await apiFetch(`/api/v1/notifications/${id}`, { method: "DELETE" });
}

// CW Manage API proxy — used by the configuration UI to validate creds and
// populate board/status pickers without exposing creds in the browser.
export interface CwProxyParams {
  cwApiUrl: string;
  cwCompanyId: string;
  cwPublicKey: string;
  cwPrivateKey: string;
  cwClientId: string;
  resource: "boards" | "statuses" | "types" | "subtypes" | "items";
  boardId?: number;
}

export async function cwProxy<T = unknown>(params: CwProxyParams): Promise<T> {
  const env = await apiFetch<Envelope<T>>("/api/cw/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return env.data;
}

export interface ApiKey {
  id: number;
  name: string;
  userID: number;
  createdDate: string;
  active: boolean;
  expires: string;
  status: "active" | "expired" | "inactive";
}

export async function fetchApiKeys(): Promise<ApiKey[]> {
  const env = await apiFetch<Envelope<ApiKey[]>>("/api/v1/api-keys");
  return env.data;
}

export async function fetchTags(): Promise<ApiTag[]> {
  const env = await apiFetch<Envelope<ApiTag[]>>("/api/v1/tags");
  return env.data;
}

export interface ApiSettings {
  serverTimezone?: string;
  keepDataPeriodDays?: number;
  customTitle?: string;
  customLogo?: string;
  [key: string]: unknown;
}

export async function fetchSettings(): Promise<ApiSettings> {
  const env = await apiFetch<Envelope<ApiSettings>>("/api/v1/settings");
  return env.data;
}
