import {
  AlertOctagon,
  Check,
  Telescope,
  RotateCw,
  Megaphone,
  CheckCircle2,
  PhoneIncoming,
  MessageCircle,
} from "lucide-react";
import { Tag, Avatar } from "./ui";
import BeatStrip from "./BeatStrip";
import type { Incident, Monitor } from "../data/fixtures";

// Driven by a real active incident (from useIncidents) plus the matching fleet
// monitor (from useFleet) for url / tags / beats. No fabricated values.
export function ActiveIncidentBanner({
  incident,
  monitor,
  withBeats = true,
}: {
  incident: Incident;
  monitor?: Monitor;
  withBeats?: boolean;
}) {
  const title = monitor?.url || incident.monitor;
  const tags = monitor?.tags ?? [];
  return (
    <div className="flex overflow-hidden rounded-2xl border border-destructive bg-card">
      <div className="flex w-[100px] shrink-0 flex-col items-center justify-center gap-2 bg-destructive px-4 py-5 text-white">
        <AlertOctagon className="size-7" strokeWidth={2.2} />
        <span className="font-mono text-[11px] font-bold tracking-[0.15em]">DOWN</span>
        <span className="font-mono text-sm font-semibold">{incident.startedAgo}</span>
      </div>
      <div className="flex-1 px-[18px] py-[18px] flex flex-col gap-2.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-base font-semibold text-fg">{incident.monitor}</span>
          {title !== incident.monitor && (
            <span className="truncate font-mono text-[12px] text-muted-fg">{title}</span>
          )}
          {tags.map((t) => (
            <Tag key={t} tone="neutral">{t}</Tag>
          ))}
        </div>
        <div className="font-mono text-[12px] leading-relaxed text-muted-fg">
          ❯ {incident.message}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
            <Check className="size-3.5" strokeWidth={3} /> Acknowledge
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
            <Telescope className="size-3.5" /> Open trace
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
            <RotateCw className="size-3.5" /> Recheck now
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
            <Megaphone className="size-3.5" /> Post to status page
          </button>
        </div>
      </div>
      {withBeats && monitor && monitor.beats.length > 0 && (
        <div className="hidden w-[200px] shrink-0 flex-col gap-1.5 bg-secondary px-4 py-[18px] md:flex">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-fg">
            Beats · last {monitor.beats.length}
          </div>
          <BeatStrip beats={monitor.beats} height={24} />
          <div className="font-mono text-[11px] text-muted-fg">avg {monitor.latencyMs}ms</div>
        </div>
      )}
    </div>
  );
}

// Used on Incidents page — shows expanded incident with full triage actions.
export function ExpandedIncidentCard({ incident }: { incident: Incident }) {
  const isDown = incident.severity === "down";
  const isAcked = incident.status === "acked";
  const stripe = isDown ? "bg-destructive" : "bg-warning-bg";
  const stripeFg = isDown ? "text-white" : "text-warning-fg";
  const border = isDown ? "border-destructive" : "border-warning-fg";
  const icon = isDown ? AlertOctagon : MessageCircle;
  const Icon = icon;

  return (
    <div className={`flex overflow-hidden rounded-2xl border ${border} bg-card`}>
      <div className={`flex w-[100px] shrink-0 flex-col items-center justify-center gap-1 px-4 py-4 ${stripe} ${stripeFg}`}>
        <Icon className="size-5" strokeWidth={2.2} />
        <span className="font-mono text-[10px] font-bold tracking-[0.15em]">
          {isDown ? "DOWN" : "SLOW"}
        </span>
        <span className="font-mono text-[13px] font-semibold">{incident.startedAgo}</span>
      </div>
      <div className="flex-1 px-[18px] py-3.5 flex flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[15px] font-semibold text-fg">{incident.monitor}</span>
          <Tag tone={isDown ? "error" : "warning"}>{incident.severity}</Tag>
          {isAcked && <Tag tone="warning">acked</Tag>}
        </div>
        <div className="font-mono text-[12px] leading-relaxed text-muted-fg">{incident.message}</div>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {isDown ? (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
              <Check className="size-3.5" strokeWidth={3} /> Acknowledge
            </button>
          ) : (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
              <CheckCircle2 className="size-3.5" /> Mark resolved
            </button>
          )}
          {isDown ? (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
              <CheckCircle2 className="size-3.5" /> Mark resolved
            </button>
          ) : (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
              <MessageCircle className="size-3.5" /> Add note
            </button>
          )}
          <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
            {isDown ? <PhoneIncoming className="size-3.5" /> : <Telescope className="size-3.5" />}
            {isDown ? "Escalate" : "Open in detail"}
          </button>
          {isDown ? (
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
              <Megaphone className="size-3.5" /> Post status
            </button>
          ) : null}
          <div className="ml-auto flex items-center gap-1.5 text-[11px]">
            {incident.owner ? (
              <>
                <span className="text-muted-fg">owner</span>
                <Avatar initials={incident.owner.initials} size={18} />
                <span className="font-mono font-medium text-fg">{incident.owner.name}</span>
              </>
            ) : (
              <span className="text-muted-fg">unassigned</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
