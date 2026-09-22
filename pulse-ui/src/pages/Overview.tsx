import {
  Heart,
  Gauge,
  ShieldCheck,
  Plus,
  Bell,
  Moon,
  TrendingDown,
  TrendingUp,
  Clock,
  PhoneIncoming,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { KpiCard, Sparkline } from "../components/KpiCard";
import { IconButton } from "../components/ui";
import ServiceTile from "../components/ServiceTile";
import LatencyHeatmap from "../components/LatencyHeatmap";
import ActivityFeed from "../components/ActivityFeed";
import { ActiveIncidentBanner } from "../components/IncidentTriage";
import { fleetStats as fallbackStats, monitors as fallbackMonitors, type Monitor } from "../data/fixtures";
import { useFleet } from "../hooks/useFleet";
import { useActivity } from "../hooks/useActivity";
import { useIncidents } from "../hooks/useIncidents";

// Bucket monitors by their first Kuma tag; untagged fall into "Ungrouped".
function groupByTag(monitors: Monitor[]): { tag: string; monitors: Monitor[] }[] {
  const groups = new Map<string, Monitor[]>();
  for (const m of monitors) {
    const tag = m.tags && m.tags.length > 0 ? m.tags[0] : "Ungrouped";
    (groups.get(tag) ?? groups.set(tag, []).get(tag)!).push(m);
  }
  return [...groups.entries()]
    .map(([tag, ms]) => ({ tag, monitors: ms }))
    .sort((a, b) => {
      if (a.tag === "Ungrouped") return 1; // Ungrouped last
      if (b.tag === "Ungrouped") return -1;
      return b.monitors.length - a.monitors.length;
    });
}

const RangeTabs = () => (
  <div className="inline-flex items-center gap-0.5 rounded-full bg-secondary p-1">
    {["4h", "24h", "7d", "30d"].map((t, i) => (
      <button
        key={t}
        className={[
          "rounded-full px-3.5 py-1.5 font-mono text-xs",
          i === 1
            ? "bg-bg shadow text-fg font-semibold"
            : "text-muted-fg hover:text-fg",
        ].join(" ")}
      >
        {t}
      </button>
    ))}
  </div>
);

type StatusFilter = "all" | "up" | "degraded" | "down";

function FilterChip({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "neutral" | "success" | "warning" | "error";
  onClick: () => void;
  children: ReactNode;
}) {
  const inactive = {
    neutral: "bg-secondary text-secondary-fg hover:bg-secondary/80",
    success: "bg-success-bg/60 text-success-fg hover:bg-success-bg",
    warning: "bg-warning-bg/60 text-warning-fg hover:bg-warning-bg",
    error: "bg-error-bg/60 text-error-fg hover:bg-error-bg",
  }[tone];
  const activeCls = {
    neutral: "bg-fg text-bg ring-fg/40",
    success: "bg-success-bg text-success-fg ring-success-fg/40",
    warning: "bg-warning-bg text-warning-fg ring-warning-fg/40",
    error: "bg-error-bg text-error-fg ring-error-fg/40",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] transition",
        active ? `${activeCls} ring-2` : inactive,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Overview() {
  // In dev (`npm run dev` standalone) the API isn't reachable — fall back to fixtures
  // so the design still renders. In production we always hit /api/v1.
  const live = useFleet();
  const activity = useActivity();
  const incidents = useIncidents();
  const isDev = import.meta.env.DEV;
  const useFallback = isDev && live.kind !== "ready";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const healthSpark = live.kind === "ready" ? live.data.healthSpark : [];
  const latencySpark = live.kind === "ready" ? live.data.latencySpark : [];

  const allMonitors = live.kind === "ready" ? live.data.monitors : useFallback ? fallbackMonitors : [];
  const monitors =
    statusFilter === "all"
      ? allMonitors
      : allMonitors.filter((m) => m.status === statusFilter);
  const stats =
    live.kind === "ready"
      ? {
          fleetHealth: live.data.fleetHealth,
          fleetHealthDelta: 0,
          down: live.data.down,
          total: live.data.total,
          p95: live.data.p95,
          p95Delta: 0,
        }
      : fallbackStats;
  const groups = groupByTag(monitors);
  // Prefer the real incident record (has failure message + downtime); fall back
  // to the fleet's own down signal so the banner still shows during the brief
  // window before important-heartbeats load.
  const activeIncident =
    incidents.kind === "ready" && incidents.data.active.length > 0
      ? incidents.data.active[0]
      : null;
  const bannerMonitor = activeIncident
    ? allMonitors.find((m) => m.name === activeIncident.monitor)
    : undefined;

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb>Production</Crumb>
            <CrumbSep />
            <Crumb active>Overview</Crumb>
          </>
        }
        right={
          <>
            <LivePill />
            <IconButton aria-label="Theme">
              <Moon className="size-4" />
            </IconButton>
            <IconButton aria-label="Notifications">
              <Bell className="size-4" />
            </IconButton>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-[13px] font-medium text-primary-fg hover:opacity-90">
              <Plus className="size-4" strokeWidth={2.2} />
              New monitor
            </button>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-5">
          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-mono text-[28px] font-semibold leading-tight">Overview</h1>
              <div className="text-[13px] text-muted-fg mt-1 flex items-center gap-2">
                {live.kind === "loading" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading fleet…
                  </>
                ) : live.kind === "error" ? (
                  <span className="text-error-fg">
                    {isDev
                      ? `Dev: showing mock data (${live.message})`
                      : `Couldn't load fleet — ${live.message}`}
                  </span>
                ) : (
                  <>
                    Real-time health across {stats.total} monitors · {allMonitors.length} fetched
                  </>
                )}
              </div>
            </div>
            <RangeTabs />
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Fleet health"
              icon={<Heart className="size-4 text-success-fg" />}
              value={stats.fleetHealth}
              unit="%"
              delta={
                <span className="inline-flex items-center gap-1.5">
                  <TrendingDown className="size-3.5 text-error-fg" />
                  averaged across {allMonitors.length} monitors
                </span>
              }
              deltaTone="muted"
              spark={healthSpark.length > 0 ? <Sparkline values={healthSpark} tone="success" /> : undefined}
            />
            <KpiCard
              label="Down now"
              tone={stats.down > 0 ? "destructive" : "default"}
              icon={
                stats.down > 0 ? (
                  <span className="size-2 rounded-full bg-destructive animate-pulse inline-block" />
                ) : (
                  <span className="size-2 rounded-full bg-success-fg inline-block" />
                )
              }
              value={stats.down}
              unit={<span>of {allMonitors.length}</span>}
            >
              <div className="font-mono text-[11px] text-muted-fg truncate">
                {allMonitors
                  .filter((m) => m.status === "down")
                  .map((m) => m.name)
                  .join(" · ") || "all healthy"}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-fg">
                <Clock className="size-3.5" />
                {stats.down > 0 ? "see details below" : "—"}
              </div>
            </KpiCard>
            <KpiCard
              label="p95 latency"
              icon={<Gauge className="size-4 text-warning-fg" />}
              value={stats.p95}
              unit="ms"
              delta={
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-muted-fg" />
                  across last 24h of beats
                </span>
              }
              deltaTone="muted"
              spark={latencySpark.length > 0 ? <Sparkline values={latencySpark} tone="warning" /> : undefined}
            />
            <KpiCard
              label="On-call"
              icon={<ShieldCheck className="size-4 text-info-fg" />}
            >
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="font-mono text-[15px] font-semibold text-muted-fg">
                  Rotation not configured
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-muted-fg">
                  <PhoneIncoming className="size-3.5" />
                  Uptime Kuma has no on-call — set up a rotation in Team
                </div>
              </div>
            </KpiCard>
          </div>

          {activeIncident && (
            <ActiveIncidentBanner incident={activeIncident} monitor={bannerMonitor} />
          )}

          {/* Service health grid */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-mono text-base font-semibold">Service Health</h2>
                <span className="text-[12px] text-muted-fg">
                  {allMonitors.length} services · grouped by tag
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <FilterChip
                  tone="neutral"
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                >
                  All <span className={statusFilter === "all" ? "ml-1 opacity-70" : "ml-1 text-muted-fg"}>{stats.total}</span>
                </FilterChip>
                <FilterChip
                  tone="success"
                  active={statusFilter === "up"}
                  onClick={() => setStatusFilter(statusFilter === "up" ? "all" : "up")}
                >
                  <span className="size-1.5 rounded-full bg-success-fg" />
                  Up <span className="ml-1 font-mono text-[11px]">{live.kind === "ready" ? live.data.up : 0}</span>
                </FilterChip>
                <FilterChip
                  tone="warning"
                  active={statusFilter === "degraded"}
                  onClick={() => setStatusFilter(statusFilter === "degraded" ? "all" : "degraded")}
                >
                  <span className="size-1.5 rounded-full bg-warning-fg" />
                  Degraded <span className="ml-1 font-mono text-[11px]">{live.kind === "ready" ? live.data.degraded : 0}</span>
                </FilterChip>
                <FilterChip
                  tone="error"
                  active={statusFilter === "down"}
                  onClick={() => setStatusFilter(statusFilter === "down" ? "all" : "down")}
                >
                  <span className="size-1.5 rounded-full bg-destructive" />
                  Down <span className="ml-1 font-mono text-[11px]">{stats.down}</span>
                </FilterChip>
              </div>
            </div>

            {monitors.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-fg">
                {allMonitors.length === 0
                  ? "No monitors to show yet."
                  : (
                    <>No monitors match the <span className="font-mono">{statusFilter}</span> filter.</>
                  )}
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.tag} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-fg">
                      {g.tag}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                    <span className="font-mono text-[11px] text-muted-fg">
                      {g.monitors.length} {g.monitors.length === 1 ? "monitor" : "monitors"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {g.monitors.map((m) => (
                      <ServiceTile key={m.slug} monitor={m} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Heatmap + activity */}
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1">
              <LatencyHeatmap heatmap={live.kind === "ready" ? live.data.heatmap : []} />
            </div>
            <ActivityFeed
              events={activity.kind === "ready" ? activity.events : []}
              loading={activity.kind === "loading"}
            />
          </div>
        </div>
      </div>
    </>
  );
}
