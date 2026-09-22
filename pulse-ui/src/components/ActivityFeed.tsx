import { ArrowDown, ArrowUp, TrendingUp, Wrench, Plus, Megaphone, ArrowRight, Loader2 } from "lucide-react";
import type { ActivityEvent, EventType } from "../data/fixtures";
import { Card } from "./ui";

const iconConfig: Record<EventType, { icon: typeof ArrowDown; bg: string; fg: string }> = {
  down: { icon: ArrowDown, bg: "bg-error-bg", fg: "text-error-fg" },
  degraded: { icon: TrendingUp, bg: "bg-warning-bg", fg: "text-warning-fg" },
  recovered: { icon: ArrowUp, bg: "bg-success-bg", fg: "text-success-fg" },
  maint: { icon: Wrench, bg: "bg-info-bg", fg: "text-info-fg" },
  added: { icon: Plus, bg: "bg-secondary", fg: "text-secondary-fg" },
  published: { icon: Megaphone, bg: "bg-success-bg", fg: "text-success-fg" },
};

export default function ActivityFeed({
  events,
  loading = false,
}: {
  events: ActivityEvent[];
  loading?: boolean;
}) {
  return (
    <Card className="w-[380px] shrink-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
        <h3 className="font-mono text-sm font-semibold text-fg">Activity feed</h3>
        <button className="flex items-center gap-1 font-mono text-[11px] text-muted-fg hover:text-fg">
          view all <ArrowRight className="size-3" />
        </button>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 px-[18px] py-6 font-mono text-[12px] text-muted-fg">
          <Loader2 className="size-3.5 animate-spin" /> Loading recent activity…
        </div>
      ) : events.length === 0 ? (
        <div className="px-[18px] py-6 text-center font-mono text-[12px] text-muted-fg">
          No state changes recently — all quiet.
        </div>
      ) : (
      <ul>
        {events.map((e, i) => {
          const cfg = iconConfig[e.type];
          const Icon = cfg.icon;
          return (
            <li
              key={e.id}
              className={`flex gap-3 px-[18px] py-3 ${
                i < events.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                <Icon className={`size-3.5 ${cfg.fg}`} strokeWidth={2.4} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-mono text-[13px] font-semibold text-fg">{e.title}</div>
                  <div className="font-mono text-[11px] text-muted-fg">{e.ago}</div>
                </div>
                <div className="text-[12px] text-muted-fg leading-snug">{e.detail}</div>
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </Card>
  );
}
