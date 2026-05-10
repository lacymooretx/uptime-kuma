import { Card } from "./ui";
import { latencyBars as fallbackBars, type LatencyBar } from "../data/fixtures";
import { Rocket } from "lucide-react";

const toneCls = {
  ok: "bg-success-fg/55",
  slow: "bg-warning-fg",
  error: "bg-destructive",
};

export default function LatencyChart({
  bars,
  deployLabel,
}: {
  bars?: LatencyBar[];
  deployLabel?: string;
} = {}) {
  const latencyBars = bars && bars.length > 0 ? bars : fallbackBars;
  return (
    <Card className="flex flex-col gap-3.5 p-[18px]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-semibold">Response time</h3>
          <div className="text-[11px] text-muted-fg">
            60 minutes · sample every 60s · vertical bands = deploys
          </div>
        </div>
        <div className="flex items-center gap-3.5 text-[11px]">
          <span className="flex items-center gap-1.5 text-muted-fg">
            <span className="size-2.5 rounded-sm bg-success-fg/60" /> p50
          </span>
          <span className="flex items-center gap-1.5 text-muted-fg">
            <span className="size-2.5 rounded-sm bg-warning-fg/70" /> p95
          </span>
          <span className="flex items-center gap-1.5 text-muted-fg">
            <span className="size-2.5 rounded-sm bg-destructive/85" /> errors
          </span>
        </div>
      </div>

      <div className="flex items-end gap-[2px] h-[200px]">
        {latencyBars.map((bar, i) => (
          <span
            key={i}
            className={`flex-1 rounded-[1px] ${toneCls[bar.tone]}`}
            style={{ height: `${bar.h * 100}%`, opacity: bar.tone === "ok" ? 0.6 : 0.95 }}
          />
        ))}
      </div>

      <div className="flex justify-between font-mono text-[10px]">
        <span className="text-muted-fg">-60m</span>
        <span className="flex items-center gap-1 font-medium text-primary">
          <Rocket className="size-3" />
          {deployLabel || "deploy 38m ago · servicetracker @ d4f8a2b"}
        </span>
        <span className="font-semibold text-fg">now</span>
      </div>
    </Card>
  );
}
