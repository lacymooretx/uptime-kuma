import { Link } from "react-router-dom";
import {
  Plus,
  Bell,
  Moon,
  Search as SearchIcon,
  SlidersHorizontal,
  ArrowUpDown,
  Loader2,
  Pause,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { IconButton, Tag } from "../components/ui";
import BeatStrip from "../components/BeatStrip";
import { useFleet } from "../hooks/useFleet";

type Filter = "all" | "up" | "degraded" | "down" | "maint";

const filterChips: { id: Filter; label: string; tone: "neutral" | "success" | "warning" | "error" | "info" }[] = [
  { id: "all", label: "All", tone: "neutral" },
  { id: "up", label: "Up", tone: "success" },
  { id: "degraded", label: "Degraded", tone: "warning" },
  { id: "down", label: "Down", tone: "error" },
  { id: "maint", label: "Maintenance", tone: "info" },
];

export default function MonitorsList() {
  const live = useFleet();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const monitors = live.kind === "ready" ? live.data.monitors : [];

  const filtered = useMemo(() => {
    return monitors.filter((m) => {
      if (filter !== "all" && m.status !== filter) return false;
      if (query && !m.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [monitors, filter, query]);

  const counts = useMemo(() => ({
    all: monitors.length,
    up: monitors.filter((m) => m.status === "up").length,
    degraded: monitors.filter((m) => m.status === "degraded").length,
    down: monitors.filter((m) => m.status === "down").length,
    maint: monitors.filter((m) => m.status === "maint").length,
  }), [monitors]);

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb active>Monitors</Crumb>
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-mono text-[28px] font-semibold leading-tight">Monitors</h1>
              <div className="text-[13px] text-muted-fg mt-1">
                {live.kind === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" /> Loading…
                  </span>
                ) : live.kind === "error" ? (
                  <span className="text-error-fg">Couldn't load — {live.message}</span>
                ) : (
                  <>
                    {live.data.total} configured · showing {filtered.length} of {monitors.length}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 w-[280px]">
              <SearchIcon className="size-4 text-muted-fg" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                className="flex-1 bg-transparent font-mono text-[12px] focus:outline-none placeholder:text-muted-fg"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {filterChips.map((chip) => {
                const isActive = filter === chip.id;
                const cls = isActive
                  ? chip.tone === "success"
                    ? "bg-success-bg text-success-fg"
                    : chip.tone === "warning"
                      ? "bg-warning-bg text-warning-fg"
                      : chip.tone === "error"
                        ? "bg-error-bg text-error-fg"
                        : chip.tone === "info"
                          ? "bg-info-bg text-info-fg"
                          : "bg-bg text-fg shadow"
                  : "bg-secondary text-muted-fg hover:text-fg";
                return (
                  <button
                    key={chip.id}
                    onClick={() => setFilter(chip.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] font-medium ${cls}`}
                  >
                    {chip.label}
                    <span className="opacity-70">{counts[chip.id]}</span>
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
                <SlidersHorizontal className="size-3.5" /> Filter
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
                <ArrowUpDown className="size-3.5" /> Sort: Name ↑
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[40px_1fr_120px_140px_240px_120px_80px] items-center gap-4 border-b border-border px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
              <div></div>
              <div>Monitor</div>
              <div>Type</div>
              <div>Region</div>
              <div>Last 30 beats</div>
              <div>Latency</div>
              <div className="text-right">Uptime</div>
            </div>

            {live.kind === "loading" && (
              <div className="flex items-center justify-center gap-2 px-5 py-12 font-mono text-[12px] text-muted-fg">
                <Loader2 className="size-4 animate-spin" /> Fetching fleet…
              </div>
            )}

            {filtered.map((m) => {
              const dotCls =
                m.status === "down"
                  ? "bg-destructive"
                  : m.status === "degraded"
                    ? "bg-warning-fg"
                    : m.status === "maint"
                      ? "bg-info-fg"
                      : "bg-success-fg";
              return (
                <Link
                  key={m.slug}
                  to={`/monitors/${m.slug}`}
                  className="grid grid-cols-[40px_1fr_120px_140px_240px_120px_80px] items-center gap-4 border-b border-border px-5 py-3 transition-colors hover:bg-secondary/30 last:border-b-0"
                >
                  <span className={`size-2 rounded-full ${dotCls}`} />
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[13px] font-semibold text-fg">{m.name}</div>
                    <div className="truncate font-mono text-[11px] text-muted-fg">
                      {m.url || "—"}
                    </div>
                  </div>
                  <div className="font-mono text-[12px]">
                    <Tag>{m.framework}</Tag>
                  </div>
                  <div className="truncate font-mono text-[12px] text-muted-fg">{m.region}</div>
                  <div className="min-w-0">
                    <BeatStrip beats={m.beats} height={14} />
                  </div>
                  <div
                    className={`font-mono text-[12px] ${
                      m.status === "degraded" ? "text-warning-fg" : "text-fg"
                    }`}
                  >
                    {m.latencyMs}ms
                  </div>
                  <div className="text-right font-mono text-[13px] font-semibold">
                    {m.uptime30d.toFixed(2)}%
                  </div>
                </Link>
              );
            })}

            {live.kind === "ready" && filtered.length === 0 && (
              <div className="px-5 py-12 text-center font-mono text-[12px] text-muted-fg">
                <Pause className="mx-auto mb-2 size-4 opacity-60" />
                No monitors match these filters
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
