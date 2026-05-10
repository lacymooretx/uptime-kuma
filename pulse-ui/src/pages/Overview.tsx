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
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { KpiCard, Sparkline } from "../components/KpiCard";
import { IconButton, Avatar, Tag } from "../components/ui";
import ServiceTile from "../components/ServiceTile";
import LatencyHeatmap from "../components/LatencyHeatmap";
import ActivityFeed from "../components/ActivityFeed";
import { ActiveIncidentBanner } from "../components/IncidentTriage";
import { fleetStats as fallbackStats, monitors as fallbackMonitors } from "../data/fixtures";
import { useFleet } from "../hooks/useFleet";

const fleetSpark = [0.3, 0.5, 0.45, 0.6, 0.7, 0.65, 0.75, 0.7, 0.8, 0.75, 0.4, 0.2, 0.55, 0.7, 0.75, 0.8, 0.85];
const latencySpark = [0.3, 0.4, 0.4, 0.45, 0.55, 0.5, 0.6, 0.55, 0.65, 0.7, 0.6, 0.78, 0.85, 0.95, 0.9, 0.92, 1];

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

export default function Overview() {
  // In dev (`npm run dev` standalone) the API isn't reachable — fall back to fixtures
  // so the design still renders. In production we always hit /api/v1.
  const live = useFleet();
  const isDev = import.meta.env.DEV;
  const useFallback = isDev && live.kind !== "ready";

  const monitors = live.kind === "ready" ? live.data.monitors : useFallback ? fallbackMonitors : [];
  const stats =
    live.kind === "ready"
      ? {
          fleetHealth: live.data.fleetHealth,
          fleetHealthDelta: 0,
          down: live.data.down,
          total: live.data.total,
          p95: live.data.p95,
          p95Delta: 0,
          oncall: fallbackStats.oncall,
        }
      : fallbackStats;
  const hasIncident = monitors.some((m) => m.status === "down");

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
                    Real-time health across {stats.total} monitors · {monitors.length} fetched
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
                  averaged across {monitors.length} monitors
                </span>
              }
              deltaTone="muted"
              spark={<Sparkline values={fleetSpark} tone="success" />}
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
              unit={<span>of {monitors.length}</span>}
            >
              <div className="font-mono text-[11px] text-muted-fg truncate">
                {monitors
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
              spark={<Sparkline values={latencySpark} tone="warning" />}
            />
            <KpiCard
              label="On-call"
              icon={<ShieldCheck className="size-4 text-info-fg" />}
            >
              <div className="flex items-center gap-3 mt-1">
                <Avatar initials={stats.oncall.initials} tone="info" size={44} />
                <div>
                  <div className="font-mono text-base font-semibold text-fg">
                    {stats.oncall.name}
                  </div>
                  <div className="text-[12px] text-muted-fg">primary · 4h 12m left</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-fg">
                <PhoneIncoming className="size-3.5" />
                escalates to Riley · {stats.oncall.escalateMinutes}m
              </div>
            </KpiCard>
          </div>

          {hasIncident && <ActiveIncidentBanner />}

          {/* Service health grid */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-mono text-base font-semibold">Service Health</h2>
                <span className="text-[12px] text-muted-fg">
                  12 services · grouped by environment
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag>All <span className="text-muted-fg ml-1">{stats.total}</span></Tag>
                <Tag tone="success">
                  <span className="size-1.5 rounded-full bg-success-fg" />
                  Up <span className="ml-1 font-mono text-[11px]">{live.kind === "ready" ? live.data.up : 0}</span>
                </Tag>
                <Tag tone="warning">
                  <span className="size-1.5 rounded-full bg-warning-fg" />
                  Degraded <span className="ml-1 font-mono text-[11px]">{live.kind === "ready" ? live.data.degraded : 0}</span>
                </Tag>
                <Tag tone="error">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  Down <span className="ml-1 font-mono text-[11px]">{stats.down}</span>
                </Tag>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-muted-fg">
                PRODUCTION
              </span>
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-[11px] text-muted-fg">
                8 services · 32 monitors
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {monitors.map((m) => (
                <ServiceTile key={m.slug} monitor={m} />
              ))}
            </div>
          </div>

          {/* Heatmap + activity */}
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1">
              <LatencyHeatmap />
            </div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </>
  );
}
