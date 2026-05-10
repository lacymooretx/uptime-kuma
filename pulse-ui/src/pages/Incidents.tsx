import { Download, Filter, ChevronDown, Loader2, Bot } from "lucide-react";
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { Card, StatLabel, Tag, Avatar } from "../components/ui";
import Swimlane from "../components/Swimlane";
import { ExpandedIncidentCard } from "../components/IncidentTriage";
import { useIncidents, fmtMttrShort } from "../hooks/useIncidents";

const RangeTabs = () => (
  <div className="inline-flex items-center gap-0.5 rounded-full bg-secondary p-1">
    {["24h", "7d", "30d", "90d"].map((t, i) => (
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

export default function Incidents() {
  const state = useIncidents();
  const ready = state.kind === "ready" ? state.data : null;
  const activeCount = ready?.active.length ?? 0;
  const openedLast7d = ready?.openedLast7d ?? 0;
  const mttr = ready ? fmtMttrShort(ready.mttrSec) : "—";
  const mtbf = ready ? `${ready.mtbfHours}h` : "—";

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb active>Incidents</Crumb>
          </>
        }
        right={
          <>
            <LivePill />
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80">
              <Download className="size-3.5" /> Export
            </button>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-mono text-[28px] font-semibold leading-tight">Incidents</h1>
                {activeCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-error-bg px-2.5 py-1 font-mono text-[11px] font-semibold text-error-fg">
                    <span className="size-1.5 rounded-full bg-destructive" />
                    {activeCount} active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 font-mono text-[11px] font-semibold text-success-fg">
                    <span className="size-1.5 rounded-full bg-success-fg" />
                    all clear
                  </span>
                )}
              </div>
              <div className="text-[13px] text-muted-fg mt-1 flex items-center gap-2">
                {state.kind === "loading" ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Aggregating events from monitor heartbeats…
                  </>
                ) : state.kind === "error" ? (
                  <span className="text-error-fg">Couldn't load — {state.message}</span>
                ) : (
                  "Cross-monitor incident log · ack, escalate, post to status page"
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RangeTabs />
              <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80">
                <Filter className="size-3.5" /> Filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            <Card tone={activeCount > 0 ? "destructive" : "default"} className="p-3.5 flex flex-col gap-1">
              <StatLabel>{activeCount > 0 ? <span className="text-destructive">Active now</span> : "Active now"}</StatLabel>
              <div className={`font-mono text-[28px] font-semibold leading-tight ${activeCount > 0 ? "text-destructive" : ""}`}>
                {activeCount}
              </div>
              <div className="text-[11px] text-muted-fg">
                {ready && ready.active[0]
                  ? `oldest ${ready.active[0].startedAgo} · ${ready.active.length} unacked`
                  : "no live incidents"}
              </div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Opened · 7d</StatLabel>
              <div className="font-mono text-[28px] font-semibold leading-tight">{openedLast7d}</div>
              <div className="text-[11px] text-muted-fg">across {ready?.lanes.length ?? 0} affected services</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>MTTR · 7d</StatLabel>
              <div className="font-mono text-[28px] font-semibold leading-tight">{mttr}</div>
              <div className="text-[11px] text-muted-fg">avg time to recover</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>MTBF · 7d</StatLabel>
              <div className="font-mono text-[28px] font-semibold leading-tight">{mtbf}</div>
              <div className="text-[11px] text-muted-fg">between any two failures</div>
            </Card>
          </div>

          <Swimlane lanes={ready?.lanes ?? []} />

          {/* Active section */}
          {activeCount > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-destructive">ACTIVE</span>
                <span className="font-mono text-[11px] text-muted-fg">{activeCount} incidents</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-col gap-3.5">
                {ready!.active.map((i) => (
                  <ExpandedIncidentCard key={i.id} incident={i} />
                ))}
              </div>
            </div>
          )}

          {/* Resolved */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
              <div className="flex items-center gap-2.5">
                <h3 className="font-mono text-sm font-semibold">Resolved · 30d</h3>
                <span className="font-mono text-[11px] text-muted-fg">
                  {ready ? `${ready.resolved.length} shown · MTTR ${mttr}` : "—"}
                </span>
              </div>
              <button className="flex items-center gap-1 font-mono text-[11px] text-muted-fg hover:text-fg">
                sort by: <span className="font-medium text-fg">newest</span>
                <ChevronDown className="size-3" />
              </button>
            </div>
            <ul>
              {ready && ready.resolved.length === 0 && (
                <li className="px-[18px] py-6 text-center font-mono text-[12px] text-muted-fg">
                  No resolved incidents in the last 30 days
                </li>
              )}
              {ready?.resolved.map((r, i) => (
                <li
                  key={r.id}
                  className={[
                    "flex flex-wrap items-center gap-3.5 px-[18px] py-2.5",
                    i < ready.resolved.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <Tag tone="neutral">
                    <span className="font-bold tracking-[0.05em]">{r.severity.toUpperCase()}</span>
                  </Tag>
                  <span className="w-40 truncate font-mono text-[13px] font-medium text-fg">{r.monitor}</span>
                  <span className="flex-1 min-w-[200px] truncate font-mono text-[12px] text-muted-fg">{r.message}</span>
                  <span className="font-mono text-[11px] font-semibold text-fg">{r.duration}</span>
                  <span className="font-mono text-[11px] text-muted-fg">{r.startedAgo}</span>
                  {r.owner?.isBot ? (
                    <div className="flex size-[22px] items-center justify-center rounded-full bg-info-bg text-info-fg">
                      <Bot className="size-3" />
                    </div>
                  ) : r.owner ? (
                    <Avatar
                      initials={r.owner.initials}
                      size={22}
                      tone={r.owner.initials === "LM" ? "primary" : "secondary"}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
