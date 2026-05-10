import { Card } from "./ui";
import { last30Days as fallbackDays, type DayState } from "../data/fixtures";

const cls: Record<DayState, string> = {
  up: "bg-success-fg/55",
  warn: "bg-warning-fg/65",
  down: "bg-destructive",
  maint: "bg-info-fg/55",
};

export default function ThirtyDayStrip({
  days,
  uptimeLabel,
  summary,
}: {
  days?: DayState[];
  uptimeLabel?: string;
  summary?: string;
} = {}) {
  const last30Days = days && days.length > 0 ? days : fallbackDays;
  const headerLabel = uptimeLabel ?? "99.31% over 30 days";
  const footerSummary = summary ?? "4 incidents · 1 maintenance · 2 deploys";
  return (
    <Card className="p-[18px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-semibold">30-day uptime</h3>
          <div className="text-[11px] text-muted-fg">
            each cell = 1 day · color = % checks succeeded
          </div>
        </div>
        <div className="font-mono text-[13px] font-semibold">{headerLabel}</div>
      </div>
      <div className="flex h-[42px] gap-[3px]">
        {last30Days.map((d, i) => (
          <span key={i} className={`flex-1 rounded-[3px] ${cls[d]}`} />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px]">
        <span className="text-muted-fg">30 days ago</span>
        <span className="text-muted-fg">{footerSummary}</span>
        <span className="font-semibold text-destructive">today</span>
      </div>
    </Card>
  );
}
