import { Card } from "./ui";
import { heatmap } from "../data/fixtures";

const colorFor = (rowIndex: number, intensity: number) => {
  // Top row = slowest = red. Middle = warning. Bottom = success.
  if (rowIndex === 0) return `rgba(255, 92, 51, ${0.05 + intensity * 0.95})`;
  if (rowIndex === 1) return `rgba(255, 132, 0, ${0.15 + intensity * 0.8})`;
  return `rgba(182, 255, 206, ${0.2 + intensity * 0.55})`;
};

export default function LatencyHeatmap() {
  return (
    <Card className="p-[18px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-sm font-semibold text-fg">Latency distribution</h3>
          <div className="font-sans text-[11px] text-muted-fg">
            24h · all monitors · response time vs frequency
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-fg">low</span>
          <div className="flex h-2 w-20 overflow-hidden rounded-sm">
            <span className="flex-1 bg-success-fg/20" />
            <span className="flex-1 bg-success-fg/40" />
            <span className="flex-1 bg-success-fg/60" />
            <span className="flex-1 bg-warning-fg/70" />
            <span className="flex-1 bg-destructive/90" />
          </div>
          <span className="font-mono text-[10px] text-muted-fg">high</span>
        </div>
      </div>

      <div className="flex gap-2.5">
        <div className="flex flex-col justify-between font-mono text-[10px] text-muted-fg" style={{ height: 130 }}>
          {heatmap.map((row) => (
            <div key={row.label}>{row.label}</div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-[2px]">
          {heatmap.map((row, ri) => (
            <div key={row.label} className="flex h-6 gap-[2px]">
              {row.values.map((v, ci) => (
                <span
                  key={ci}
                  className="flex-1 rounded-[1px]"
                  style={{ background: colorFor(ri, v) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pl-7 font-mono text-[10px] text-muted-fg">
        <span>24h ago</span>
        <span>18h</span>
        <span>12h</span>
        <span>6h</span>
        <span className="font-semibold text-fg">now</span>
      </div>
    </Card>
  );
}
