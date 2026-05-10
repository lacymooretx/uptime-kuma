import { Link } from "react-router-dom";
import type { Monitor } from "../data/fixtures";
import BeatStrip from "./BeatStrip";

const dotCls = (status: Monitor["status"]) =>
  ({
    up: "bg-success-fg",
    degraded: "bg-warning-fg",
    down: "bg-destructive",
    maint: "bg-info-fg",
  })[status];

const borderCls = (status: Monitor["status"]) =>
  ({
    up: "border-border",
    degraded: "border-warning-fg",
    down: "border-destructive",
    maint: "border-info-fg",
  })[status];

const statusBadge = (m: Monitor) => {
  if (m.status === "down") return <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-destructive">DOWN</span>;
  if (m.status === "degraded") return <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-warning-fg">SLOW</span>;
  return <span className="font-mono text-[10px] font-bold text-success-fg">{m.uptime30d.toFixed(0)}%</span>;
};

const footerStat = (m: Monitor) => {
  if (m.status === "down") return <span className="text-destructive">7m down</span>;
  if (m.status === "degraded") return <span className="text-warning-fg">{m.latencyMs}ms p95</span>;
  return <span className="text-muted-fg">{m.latencyMs}ms</span>;
};

export default function ServiceTile({ monitor: m }: { monitor: Monitor }) {
  return (
    <Link
      to={`/monitors/${m.slug}`}
      className={`flex flex-col gap-2.5 rounded-xl border ${borderCls(m.status)} bg-card p-3.5 transition-colors hover:bg-card/80`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`size-2 shrink-0 rounded-full ${dotCls(m.status)}`} />
          <span className="truncate font-mono text-[13px] font-semibold text-fg">{m.name}</span>
        </div>
        {statusBadge(m)}
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-fg">
        <span>{m.framework}</span>
        <span>·</span>
        <span>{m.checks} checks</span>
        <span>·</span>
        <span className="truncate">{m.region}</span>
      </div>
      <BeatStrip beats={m.beats} height={18} />
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="font-semibold text-fg">{m.uptime30d.toFixed(2)}%</span>
        {footerStat(m)}
      </div>
    </Link>
  );
}
