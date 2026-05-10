import type { ReactNode } from "react";
import { Card, StatLabel } from "./ui";

export function KpiCard({
  label,
  icon,
  value,
  unit,
  delta,
  deltaTone = "muted",
  spark,
  tone = "default",
  children,
}: {
  label: string;
  icon?: ReactNode;
  value?: ReactNode;
  unit?: ReactNode;
  delta?: ReactNode;
  deltaTone?: "success" | "warning" | "error" | "muted";
  spark?: ReactNode;
  tone?: "default" | "destructive";
  children?: ReactNode;
}) {
  const deltaCls = {
    success: "text-success-fg",
    warning: "text-warning-fg",
    error: "text-error-fg",
    muted: "text-muted-fg",
  }[deltaTone];

  return (
    <Card
      className="flex-1 p-[18px] flex flex-col gap-2"
      tone={tone === "destructive" ? "destructive" : "default"}
    >
      <div className="flex items-center justify-between">
        <StatLabel>{label}</StatLabel>
        {icon && <span className="text-muted-fg">{icon}</span>}
      </div>
      {value !== undefined && (
        <div className="flex items-end gap-2 leading-none">
          <span
            className={`font-mono text-4xl font-semibold ${tone === "destructive" ? "text-destructive" : "text-fg"}`}
          >
            {value}
          </span>
          {unit && <span className="font-mono text-base text-muted-fg pb-1">{unit}</span>}
        </div>
      )}
      {delta && (
        <div className={`font-sans text-xs ${deltaCls}`}>{delta}</div>
      )}
      {spark}
      {children}
    </Card>
  );
}

// Simple stacked-bar sparkline rendered via a flex row of bars with varying height.
export function Sparkline({
  values,
  height = 24,
  tone = "success",
}: {
  values: number[];
  height?: number;
  tone?: "success" | "warning" | "error" | "muted";
}) {
  const toneCls = {
    success: "bg-success-fg",
    warning: "bg-warning-fg",
    error: "bg-destructive",
    muted: "bg-muted-fg",
  }[tone];
  const max = Math.max(...values, 1);
  return (
    <div className="flex w-full items-end gap-[2px]" style={{ height }}>
      {values.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        const opacity = 0.35 + (v / max) * 0.6;
        return (
          <span
            key={i}
            className={`flex-1 rounded-[1px] ${toneCls}`}
            style={{ height: h, opacity }}
          />
        );
      })}
    </div>
  );
}
