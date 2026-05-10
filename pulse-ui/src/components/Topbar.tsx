import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function Crumb({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={[
        "font-mono text-[13px]",
        active ? "font-medium text-fg" : "text-muted-fg",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function CrumbSep() {
  return <ChevronRight className="size-3.5 text-muted-fg" strokeWidth={1.5} />;
}

export function Topbar({
  left,
  right,
}: {
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border px-7 py-3.5">
      <div className="flex min-w-0 items-center gap-2">{left}</div>
      <div className="flex items-center gap-2.5">{right}</div>
    </header>
  );
}

export function LivePill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1">
      <span className="size-1.5 rounded-full bg-success-fg" />
      <span className="font-mono text-[11px] font-semibold text-success-fg">LIVE · 1m</span>
    </span>
  );
}

export function UnsavedPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2 py-0.5">
      <span className="size-1 rounded-full bg-warning-fg" />
      <span className="font-mono text-[11px] font-medium text-warning-fg">unsaved changes</span>
    </span>
  );
}
