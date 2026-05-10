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
} from "lucide-react";
import { Topbar, Crumb, CrumbSep } from "../components/Topbar";
import { Card, IconButton, Tag, StatLabel } from "../components/ui";
import LatencyChart from "../components/LatencyChart";
import ThirtyDayStrip from "../components/ThirtyDayStrip";

type IncidentRow = {
  sev: string;
  tone: "destructive" | "neutral" | "info";
  title: string;
  meta: string;
  duration: string;
  highlight?: boolean;
};

const incidentRows: IncidentRow[] = [
  { sev: "ACTIVE", tone: "destructive", title: "HTTP 500 · keyword match \"An error occurred\"", meta: "started 7m 22s ago · 22:14 UTC", duration: "—", highlight: true },
  { sev: "RESOLVED", tone: "neutral", title: "Connection timeout · 5 consecutive checks", meta: "3 days ago · MTTR 4m 38s · auto-recovered", duration: "4m" },
  { sev: "RESOLVED", tone: "neutral", title: "HTTP 502 · upstream connection refused", meta: "8 days ago · MTTR 11m · acked by lacy", duration: "11m" },
  { sev: "MAINT", tone: "info", title: "Cert renewal window · planned", meta: "14 days ago · 12m duration · alerts suppressed", duration: "12m" },
];

const certRows = [
  ["Issued", "2026-04-27"],
  ["Expires", "2026-06-26"],
  ["SHA-256", "a4:8c:91:e2:…"],
  ["OCSP staple", "good · 4h fresh", "success"],
] as const;

const tabs = ["Overview", "Latency", "Errors", "Headers", "Certificate", "Configuration"];

export default function MonitorDetail() {
  return (
    <>
      <Topbar
        left={
          <>
            <ArrowLeft className="size-4 text-muted-fg" />
            <Crumb>Monitors</Crumb>
            <CrumbSep />
            <Crumb>servicetracker</Crumb>
            <CrumbSep />
            <Crumb active>service-log.3endt.com</Crumb>
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-error-bg px-3 py-1.5">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  <span className="font-mono text-[11px] font-bold tracking-[0.05em] text-error-fg">
                    DOWN · 7m 22s
                  </span>
                </span>
                <span className="font-mono text-[11px] text-muted-fg">servicetracker</span>
                <Tag tone="info">asp.net</Tag>
                <Tag>prod</Tag>
                <Tag>us-east</Tag>
              </div>
              <h1 className="font-mono text-[32px] font-semibold leading-tight truncate">
                service-log.3endt.com
              </h1>
              <div className="flex flex-wrap items-center gap-3.5 text-[12px] text-muted-fg font-mono">
                <span className="flex items-center gap-1.5">
                  <Globe className="size-3.5" /> GET https://service-log.3endt.com/health
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="size-3.5" /> 60s interval
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> cert · 47d
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
              <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
                <Check className="size-3.5" strokeWidth={3} /> Acknowledge
              </button>
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
                {t === "Errors" && (
                  <span className="rounded-full bg-destructive px-1.5 py-0 text-[10px] font-semibold text-white">
                    3
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Uptime · 30d</StatLabel>
              <div className="font-mono text-2xl font-semibold leading-tight">99.31%</div>
              <div className="text-[11px] text-error-fg">target 99.9% · -0.59% to SLO</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>MTTR · 30d</StatLabel>
              <div className="font-mono text-2xl font-semibold leading-tight">6m 14s</div>
              <div className="text-[11px] text-success-fg">-2m vs prev period</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Latency · now</StatLabel>
              <div className="flex items-end gap-2 leading-tight">
                <span className="font-mono text-2xl font-semibold">142</span>
                <span className="font-mono text-sm font-medium text-muted-fg">/ 287</span>
                <span className="font-mono text-sm font-medium text-warning-fg">/ 612 ms</span>
              </div>
              <div className="text-[11px] text-muted-fg">p50 · p95 · p99</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Incidents · 30d</StatLabel>
              <div className="font-mono text-2xl font-semibold leading-tight">7</div>
              <div className="text-[11px] text-muted-fg">4 acked · 2 auto-recovered · 1 active</div>
            </Card>
          </div>

          <LatencyChart />
          <ThirtyDayStrip />

          {/* Bottom row: incidents + cert */}
          <div className="flex flex-col gap-3.5 lg:flex-row">
            <Card className="min-w-0 flex-1 overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-mono text-sm font-semibold">Recent incidents</h3>
                  <span className="font-mono text-[11px] text-muted-fg">7 in last 30d</span>
                </div>
                <button className="font-mono text-[11px] text-muted-fg hover:text-fg">
                  view all →
                </button>
              </div>
              <ul>
                {incidentRows.map((r, i) => (
                  <li
                    key={i}
                    className={[
                      "flex items-center gap-3.5 px-[18px] py-3",
                      i < incidentRows.length - 1 ? "border-b border-border" : "",
                      r.highlight ? "bg-error-bg/40" : "",
                    ].join(" ")}
                  >
                    <Tag
                      tone={
                        r.tone === "destructive"
                          ? "error"
                          : r.tone === "info"
                            ? "info"
                            : "neutral"
                      }
                    >
                      <span className="font-bold tracking-[0.05em]">{r.sev}</span>
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
                <div className="flex items-center gap-3.5">
                  <div className="flex size-20 flex-col items-center justify-center rounded-full bg-success-bg ring-2 ring-success-fg">
                    <span className="font-mono text-[28px] font-semibold text-success-fg leading-none">47</span>
                    <span className="font-mono text-[9px] font-semibold tracking-[0.15em] text-success-fg mt-0.5">DAYS</span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="font-mono text-sm font-semibold">Let's Encrypt R3</div>
                    <div className="font-mono text-[11px] text-muted-fg">*.3endt.com · ECDSA P-256</div>
                    <div className="text-[11px] text-success-fg">renews automatically · last 12d ago</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {certRows.map(([k, v, tone]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-muted-fg">{k}</span>
                      <span
                        className={`font-mono text-[11px] font-medium ${
                          tone === "success" ? "text-success-fg" : "text-fg"
                        }`}
                      >
                        {v}
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
