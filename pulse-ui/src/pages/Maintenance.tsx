import { useEffect, useState } from "react";
import {
  Plus,
  Wrench,
  Calendar,
  RotateCcw,
  Pause,
  Play,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { Card, IconButton, Tag, StatLabel } from "../components/ui";
import { fetchMaintenance, type ApiMaintenance } from "../lib/api";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; list: ApiMaintenance[] };

export default function Maintenance() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchMaintenance();
        if (!cancelled) setState({ kind: "ready", list });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = state.kind === "ready" ? state.list : [];
  const active = list.filter((m) => m.active);
  const idle = list.filter((m) => !m.active);

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb active>Maintenance</Crumb>
          </>
        }
        right={
          <>
            <LivePill />
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-[13px] font-medium text-primary-fg hover:opacity-90">
              <Plus className="size-4" strokeWidth={2.2} />
              Schedule window
            </button>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-mono text-[28px] font-semibold leading-tight">Maintenance</h1>
              <div className="text-[13px] text-muted-fg mt-1">
                Pause alerting on planned work · monitors stay green during the window
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Active now</StatLabel>
              <div className="font-mono text-[28px] font-semibold leading-tight">{active.length}</div>
              <div className="text-[11px] text-muted-fg">windows currently suppressing alerts</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Scheduled</StatLabel>
              <div className="font-mono text-[28px] font-semibold leading-tight">{idle.length}</div>
              <div className="text-[11px] text-muted-fg">paused or upcoming</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Recurring</StatLabel>
              <div className="font-mono text-[28px] font-semibold leading-tight">
                {list.filter((m) => m.strategy && m.strategy !== "single").length}
              </div>
              <div className="text-[11px] text-muted-fg">cron / weekly / monthly</div>
            </Card>
            <Card className="p-3.5 flex flex-col gap-1">
              <StatLabel>Total · 30d</StatLabel>
              <div className="font-mono text-[28px] font-semibold leading-tight">—</div>
              <div className="text-[11px] text-muted-fg">window-hours used</div>
            </Card>
          </div>

          {state.kind === "loading" && (
            <div className="flex items-center justify-center gap-2 py-12 font-mono text-[12px] text-muted-fg">
              <Loader2 className="size-4 animate-spin" /> Loading windows…
            </div>
          )}

          {state.kind === "error" && (
            <Card className="p-6 text-center font-mono text-[13px] text-error-fg">
              Couldn't load — {state.message}
            </Card>
          )}

          {state.kind === "ready" && list.length === 0 && (
            <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
                <Wrench className="size-6 text-muted-fg" />
              </div>
              <h2 className="font-mono text-base font-semibold">No maintenance windows yet</h2>
              <p className="max-w-md text-[13px] text-muted-fg">
                Schedule a window to suppress alerts during planned work — cert renewals,
                deploys, database migrations. Affected monitors will appear blue (Maintenance)
                instead of red (Down).
              </p>
              <button className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
                <Plus className="size-3.5" strokeWidth={2.4} />
                Schedule first window
              </button>
            </Card>
          )}

          {state.kind === "ready" && list.length > 0 && (
            <Card className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
                <h3 className="font-mono text-sm font-semibold">All windows</h3>
                <span className="font-mono text-[11px] text-muted-fg">{list.length} total</span>
              </div>
              <ul>
                {list.map((m, i) => (
                  <li
                    key={m.id}
                    className={[
                      "flex items-center gap-4 px-[18px] py-3.5",
                      i < list.length - 1 ? "border-b border-border" : "",
                    ].join(" ")}
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-info-bg text-info-fg">
                      {m.active ? <Calendar className="size-4" /> : <RotateCcw className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[13px] font-semibold">{m.title}</div>
                      <div className="font-mono text-[11px] text-muted-fg">
                        {m.strategy} · {m.timezone || "—"}
                      </div>
                    </div>
                    <Tag tone={m.active ? "info" : "neutral"}>
                      {m.active ? "ACTIVE" : "PAUSED"}
                    </Tag>
                    <IconButton aria-label={m.active ? "Pause" : "Resume"}>
                      {m.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                    </IconButton>
                    <IconButton aria-label="More">
                      <MoreHorizontal className="size-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
