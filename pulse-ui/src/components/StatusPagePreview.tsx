import { AlertTriangle, Bell, Lock, RotateCw, Radar } from "lucide-react";
import { monitors } from "../data/fixtures";
import BeatStrip from "./BeatStrip";

const past = [
  { date: "May 6", title: "Servicetracker connection refused", outcome: "Resolved · 4m 12s", success: true },
  { date: "May 4", title: "Cert renewal · scheduled maintenance", outcome: "Completed · 12m", success: false },
  { date: "Apr 28", title: "People Directory upstream timeout", outcome: "Resolved · 6m 18s", success: true },
];

export default function StatusPagePreview() {
  return (
    <div className="flex flex-col gap-5 p-7 pl-7 pr-7 pt-5 pb-5 h-full overflow-y-auto bg-bg">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <Radar className="size-5" strokeWidth={2.2} />
          </div>
          <div className="font-mono text-lg font-semibold">Aspendora</div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80">
          <Bell className="size-3.5" /> Subscribe
        </button>
      </div>

      {/* Banner */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-warning-fg bg-warning-bg p-[18px]">
        <div className="flex size-10 items-center justify-center rounded-full bg-warning-fg text-warning-bg">
          <AlertTriangle className="size-5" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-lg font-semibold leading-tight text-warning-fg">
            Issue with one service
          </div>
          <div className="text-[13px] text-warning-fg">
            Updated 2 minutes ago · we are investigating
          </div>
        </div>
        <span className="font-mono text-[13px] font-semibold text-warning-fg">
          6 of 7 operational
        </span>
      </div>

      {/* Active incident card */}
      <div className="rounded-2xl border border-border bg-card p-[18px] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-error-bg px-2.5 py-1">
              <span className="size-1 rounded-full bg-destructive" />
              <span className="font-mono text-[10px] font-bold tracking-[0.12em] text-error-fg">
                INVESTIGATING
              </span>
            </span>
            <span className="font-mono text-[15px] font-semibold">
              Servicetracker is unreachable
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-fg">7 minutes ago</span>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-fg">
          Our service-log endpoint started returning HTTP 500 errors at 22:14 UTC. The team is
          investigating. We'll update this incident every 15 minutes until it's resolved.
        </p>
        <div className="flex flex-wrap items-center gap-3.5 font-mono text-[11px] text-muted-fg">
          <span>Affected: servicetracker</span>
          <span>·</span>
          <span>Severity: minor</span>
        </div>
      </div>

      {/* Service grid */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
          <h3 className="font-mono text-sm font-semibold">Services</h3>
          <span className="font-mono text-[11px] text-muted-fg">30 days · 99.42% overall</span>
        </div>
        <ul>
          {monitors.slice(0, 7).map((m, i) => (
            <li
              key={m.slug}
              className={[
                "flex items-center gap-3.5 px-[18px] py-3",
                i < 6 ? "border-b border-border" : "",
              ].join(" ")}
            >
              <div className="flex w-40 items-center gap-2 shrink-0">
                <span
                  className={[
                    "size-2 rounded-full",
                    m.status === "down" ? "bg-destructive" : "bg-success-fg",
                  ].join(" ")}
                />
                <span className="truncate font-mono text-[13px] font-medium">
                  {m.name === "servicetracker"
                    ? "Servicetracker"
                    : m.name === "callqa"
                      ? "Callqa"
                      : m.name
                          .split("-")
                          .map((w) => w[0].toUpperCase() + w.slice(1))
                          .join(" ")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <BeatStrip beats={m.beats} height={18} />
              </div>
              <span
                className={[
                  "font-mono text-[11px] font-medium shrink-0",
                  m.status === "down" ? "text-destructive font-semibold" : "text-success-fg",
                ].join(" ")}
              >
                {m.status === "down" ? "Down" : "Operational"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Past incidents */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold">Past incidents</h3>
          <span className="font-mono text-[11px] text-muted-fg">30 days · 4 incidents</span>
        </div>
        <ul>
          {past.map((p, i) => (
            <li
              key={p.title}
              className={[
                "flex items-center gap-3 py-2.5",
                i < past.length - 1 ? "border-b border-border" : "",
              ].join(" ")}
            >
              <span className="w-16 font-mono text-[11px] font-medium text-muted-fg">{p.date}</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[13px] font-medium text-fg truncate">{p.title}</div>
                <div
                  className={`text-[11px] ${p.success ? "text-success-fg" : "text-muted-fg"}`}
                >
                  {p.outcome}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PreviewWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border bg-secondary px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#FF5C33]" />
          <span className="size-2.5 rounded-full bg-[#FFB800]" />
          <span className="size-2.5 rounded-full bg-[#34C759]" />
        </div>
        <div className="flex flex-1 items-center gap-1.5 rounded-full border border-border bg-bg px-3 py-1">
          <Lock className="size-3 text-muted-fg" />
          <span className="flex-1 font-mono text-[11px] truncate">status.aspendora.com</span>
          <RotateCw className="size-3 text-muted-fg" />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
