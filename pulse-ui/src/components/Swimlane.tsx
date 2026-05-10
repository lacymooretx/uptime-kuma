import { Card } from "./ui";
import { lanes as fallbackLanes, type BeatStatus, type Lane } from "../data/fixtures";

const cellCls: Record<BeatStatus, string> = {
  up: "bg-secondary",
  warn: "bg-warning-fg/70",
  down: "bg-destructive",
  maint: "bg-info-fg/55",
  unknown: "bg-secondary",
};

const dotCls = (s: BeatStatus) =>
  ({
    up: "bg-success-fg",
    warn: "bg-warning-fg",
    down: "bg-destructive",
    maint: "bg-info-fg",
    unknown: "bg-muted-fg",
  })[s];

function buildDayLabels(): string[] {
  const labels: string[] = [];
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    if (i === 0) labels.push("Today");
    else if (i === 6) labels.push(`${dayNames[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`);
    else labels.push(`${dayNames[d.getDay()]} ${d.getDate()}`);
  }
  return labels;
}

export default function Swimlane({ lanes }: { lanes?: Lane[] } = {}) {
  const data = lanes && lanes.length > 0 ? lanes : fallbackLanes;
  const days = buildDayLabels();
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
        <div>
          <h3 className="font-mono text-sm font-semibold">
            Timeline · {data.length} monitors had incidents
          </h3>
          <div className="text-[11px] text-muted-fg">
            each row = monitor · each cell = 1 day · click for trace
          </div>
        </div>
        <div className="flex items-center gap-3.5 text-[10px] text-muted-fg font-mono">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-secondary" /> clean
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-warning-fg/70" /> degraded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-destructive" /> down
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-info-fg/55" /> maint
          </span>
        </div>
      </div>

      <div className="px-[18px] pt-2.5 pb-1.5">
        <div className="flex items-center">
          <span className="w-40 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
            Monitor
          </span>
          <div className="flex flex-1 justify-between font-mono text-[10px] text-muted-fg">
            {days.map((d, i) => (
              <span
                key={d}
                className={i === days.length - 1 ? "font-semibold text-fg" : ""}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-[18px] pb-3.5">
        {data.length === 0 && (
          <div className="py-8 text-center font-mono text-[12px] text-muted-fg">
            No incidents in the last 7 days · all clean
          </div>
        )}
        {data.map((lane) => (
          <div key={lane.name} className="flex items-center py-1.5">
            <div className="flex w-40 items-center gap-2">
              <span className={`size-1.5 rounded-full ${dotCls(lane.status)}`} />
              <span
                className={[
                  "truncate font-mono text-xs",
                  lane.status === "down"
                    ? "font-medium text-fg"
                    : lane.status === "warn"
                      ? "font-medium text-fg"
                      : "text-muted-fg",
                ].join(" ")}
              >
                {lane.name}
              </span>
            </div>
            <div className="flex flex-1 gap-[2px] h-[22px]">
              {lane.days.map((d, i) => (
                <span key={i} className={`flex-1 rounded-sm ${cellCls[d]}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
