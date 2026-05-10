import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Globe,
  Timer,
  ShieldCheck,
  Pause,
  RotateCw,
  Check,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { Topbar, Crumb, CrumbSep } from "../components/Topbar";
import { Card, IconButton, Tag, StatLabel } from "../components/ui";
import LatencyChart from "../components/LatencyChart";
import ThirtyDayStrip from "../components/ThirtyDayStrip";
import { useMonitor, fmtMttr, type MonitorView } from "../hooks/useMonitor";

const tabs = ["Overview", "Latency", "Errors", "Headers", "Certificate", "Configuration"];

const certRows: [string, string, "default" | "success"][] = [
  ["Issued", "—", "default"],
  ["Expires", "—", "default"],
  ["SHA-256", "—", "default"],
  ["OCSP staple", "not checked", "default"],
];

function statusPill(view: MonitorView) {
  if (view.status === "down") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-error-bg px-3 py-1.5">
        <span className="size-1.5 rounded-full bg-destructive" />
        <span className="font-mono text-[11px] font-bold tracking-[0.05em] text-error-fg">DOWN</span>
      </span>
    );
  }
  if (view.status === "degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-3 py-1.5">
        <span className="size-1.5 rounded-full bg-warning-fg" />
        <span className="font-mono text-[11px] font-bold tracking-[0.05em] text-warning-fg">SLOW</span>
      </span>
    );
  }
  if (view.status === "maint") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-info-bg px-3 py-1.5">
        <span className="size-1.5 rounded-full bg-info-fg" />
        <span className="font-mono text-[11px] font-bold tracking-[0.05em] text-info-fg">MAINT</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-3 py-1.5">
      <span className="size-1.5 rounded-full bg-success-fg" />
      <span className="font-mono text-[11px] font-bold tracking-[0.05em] text-success-fg">UP</span>
    </span>
  );
}

export default function MonitorDetail() {
  const { slug } = useParams<{ slug: string }>();
  const idNum = slug ? Number(slug) : NaN;
  const state = useMonitor(Number.isFinite(idNum) ? idNum : null);

  if (state.kind === "loading") {
    return (
      <>
        <Topbar
          left={<>
            <ArrowLeft className="size-4 text-muted-fg" />
            <Crumb>Monitors</Crumb>
            <CrumbSep />
            <Crumb active>{slug}</Crumb>
          </>}
        />
        <div className="flex flex-1 items-center justify-center text-muted-fg">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </>
    );
  }

  if (state.kind === "error") {
    return (
      <>
        <Topbar
          left={<>
            <ArrowLeft className="size-4 text-muted-fg" />
            <Crumb>Monitors</Crumb>
            <CrumbSep />
            <Crumb active>{slug}</Crumb>
          </>}
        />
        <div className="flex flex-1 items-center justify-center text-error-fg p-8 font-mono text-sm">
          {state.message}
        </div>
      </>
    );
  }

  const v = state.data;
  const m = v.monitor;
  const tagLine = m.tags.slice(0, 3);

  return (
    <>
      <Topbar
        left={
          <>
            <ArrowLeft className="size-4 text-muted-fg" />
            <Crumb>Monitors</Crumb>
            <CrumbSep />
            <Crumb>{m.type}</Crumb>
            <CrumbSep />
            <Crumb active>{m.name}</Crumb>
          </>
        }
        right={
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-fg">
            <ChevronLeft className="size-4" />
            <span>prev monitor</span>
            <span>·</span>
            <span>next</span>
            <ChevronRight className="size-4" />
          </div>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-[18px]">
          {/* Hero */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex flex-col gap-2.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                {statusPill(v)}
                <span className="font-mono text-[11px] text-muted-fg">{m.type}</span>
                {tagLine.map((t) => (
                  <Tag key={t.id}>{t.name}</Tag>
                ))}
              </div>
              <h1 className="font-mono text-[32px] font-semibold leading-tight truncate">
                {m.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3.5 text-[12px] text-muted-fg font-mono">
                <span className="flex items-center gap-1.5">
                  <Globe className="size-3.5" />
                  {m.url || (m.hostname ? `${m.hostname}${m.port ? ":" + m.port : ""}` : "—")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="size-3.5" /> {m.interval}s interval
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> cert · n/a
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80">
                <Pause className="size-3.5" /> Pause
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80">
                <RotateCw className="size-3.5" /> Recheck
              </button>
              {v.status === "down" && (
                <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
                  <Check className="size-3.5" strokeWidth={3} /> Acknowledge
                </button>
              )}
              <IconButton aria-label="More">
                <MoreHorizontal className="size-4" />
              </IconButton>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-border">
            {tabs.map((t, i) => (
              <button
                key={t}
                className={[
                  "flex items-center gap-1.5 px-3.5 py-2.5 font-mono text-[13px] transition-colors",
                  i === 0
                    ? "border-b-2 border-primary font-semibold text-fg"
                    : "font-medium text-muted-fg hover:text-fg",
                ].join(" ")}
              >
                {t}
                {t === "Errors" && v.incidents.length > 0 && (
                  <span className="rounded-full bg-destructive px-1.5 py-0 text-[10px] font-semibold text-white">
                    {v.incidents.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Uptime · 30d</StatLabel>
              <div className="font-mono text-2xl font-semibold leading-tight">{v.uptimePct}%</div>
              <div className="text-[11px] text-muted-fg">target 99.9% · {v.uptimePct >= 99.9 ? "on track" : `${(99.9 - v.uptimePct).toFixed(2)}% to SLO`}</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>MTTR · 30d</StatLabel>
              <div className="font-mono text-2xl font-semibold leading-tight">{fmtMttr(v.mttrSec)}</div>
              <div className="text-[11px] text-muted-fg">across {v.important.length} important events</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Latency · now</StatLabel>
              <div className="flex items-end gap-2 leading-tight">
                <span className="font-mono text-2xl font-semibold">{v.p50}</span>
                <span className="font-mono text-sm font-medium text-muted-fg">/ {v.p95}</span>
                <span className="font-mono text-sm font-medium text-warning-fg">/ {v.p99} ms</span>
              </div>
              <div className="text-[11px] text-muted-fg">p50 · p95 · p99</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Events · 30d</StatLabel>
              <div className="font-mono text-2xl font-semibold leading-tight">{v.important.length}</div>
              <div className="text-[11px] text-muted-fg">{v.incidents.filter((i) => i.status === "RESOLVED").length} resolved · {v.incidents.filter((i) => i.status === "ACTIVE").length} active</div>
            </Card>
          </div>

          <LatencyChart bars={v.latencyBars} deployLabel={`${v.chart.length} samples · last ${Math.min(60, v.chart.length)}m`} />
          <ThirtyDayStrip
            days={v.thirtyDay}
            uptimeLabel={`${v.uptimePct}% over 30 days`}
            summary={`${v.incidents.filter((i) => i.status === "RESOLVED").length} incidents · ${v.incidents.filter((i) => i.status === "MAINT").length} maintenance`}
          />

          {/* Bottom row: incidents + cert */}
          <div className="flex flex-col gap-3.5 lg:flex-row">
            <Card className="min-w-0 flex-1 overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-mono text-sm font-semibold">Recent incidents</h3>
                  <span className="font-mono text-[11px] text-muted-fg">{v.incidents.length} in last 30d</span>
                </div>
                <button className="font-mono text-[11px] text-muted-fg hover:text-fg">
                  view all →
                </button>
              </div>
              <ul>
                {v.incidents.length === 0 && (
                  <li className="px-[18px] py-6 text-center font-mono text-[12px] text-muted-fg">
                    No incidents in the last 30 days · clean run
                  </li>
                )}
                {v.incidents.map((r, i) => (
                  <li
                    key={r.id}
                    className={[
                      "flex items-center gap-3.5 px-[18px] py-3",
                      i < v.incidents.length - 1 ? "border-b border-border" : "",
                      r.highlight ? "bg-error-bg/40" : "",
                    ].join(" ")}
                  >
                    <Tag
                      tone={
                        r.status === "ACTIVE"
                          ? "error"
                          : r.status === "MAINT"
                            ? "info"
                            : "neutral"
                      }
                    >
                      <span className="font-bold tracking-[0.05em]">{r.status}</span>
                    </Tag>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[13px] font-medium text-fg truncate">{r.title}</div>
                      <div className="text-[11px] text-muted-fg">{r.meta}</div>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-muted-fg">{r.duration}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="w-full lg:w-[380px] shrink-0 overflow-hidden p-0">
              <div className="flex items-center gap-0 border-b border-border px-[18px] pt-3">
                <button className="border-b-2 border-primary px-3 py-2 font-mono text-[13px] font-semibold">
                  Certificate
                </button>
                <button className="px-3 py-2 font-mono text-[13px] text-muted-fg hover:text-fg">
                  Headers
                </button>
                <button className="px-3 py-2 font-mono text-[13px] text-muted-fg hover:text-fg">
                  DNS
                </button>
              </div>
              <div className="flex flex-col gap-3.5 p-[18px]">
                <div className="text-[12px] text-muted-fg">
                  Cert / header / DNS introspection isn't exposed by the v1 REST API yet.
                  Hookup pending — values shown are placeholders.
                </div>
                <div className="flex flex-col gap-2">
                  {certRows.map(([k, val, tone]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-muted-fg">{k}</span>
                      <span
                        className={`font-mono text-[11px] font-medium ${
                          tone === "success" ? "text-success-fg" : "text-fg"
                        }`}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
