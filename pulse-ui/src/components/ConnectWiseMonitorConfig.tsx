// Per-monitor ConnectWise ticketing config — picker that lives inside Monitor Detail.
// Renders only when the workspace has a ConnectWiseManage notification configured.
//
// Saves via PATCH /api/v1/monitors/:id with { cwConfig: {...}, notificationIDList: {...} }.
// The cwProxy fetches boards + statuses on demand using the notification's stored creds.

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Loader2, Save, CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, Tag } from "./ui";
import {
  fetchNotifications,
  cwProxy,
  type ApiNotification,
} from "../lib/api";
import { apiFetch } from "../lib/auth";

type CwBoard = { id: number; name: string };
type CwStatus = { id: number; name: string };

type CwConfig = {
  boardId?: number;
  downStatusId?: number;
  upStatusId?: number;
  activeTicketId?: number;
};

type State =
  | { kind: "loading" }
  | { kind: "no-cw" }
  | { kind: "ready"; notification: ApiNotification }
  | { kind: "error"; message: string };

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "ok" }
  | { kind: "error"; msg: string };

export default function ConnectWiseMonitorConfig({
  monitorId,
  initialAttached,
  initialConfig,
}: {
  monitorId: number;
  initialAttached: boolean;
  initialConfig: CwConfig | null;
}) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [boards, setBoards] = useState<CwBoard[] | null>(null);
  const [statuses, setStatuses] = useState<CwStatus[] | null>(null);
  const [statusesError, setStatusesError] = useState<string | null>(null);

  const [attached, setAttached] = useState(initialAttached);
  const [boardId, setBoardId] = useState<number | undefined>(initialConfig?.boardId);
  const [downStatusId, setDownStatusId] = useState<number | undefined>(initialConfig?.downStatusId);
  const [upStatusId, setUpStatusId] = useState<number | undefined>(initialConfig?.upStatusId);

  const [save, setSave] = useState<SaveStatus>({ kind: "idle" });

  // Discover the workspace's CW notification + load boards.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchNotifications();
        const cw = list.find((n) => n.type === "ConnectWiseManage");
        if (!cw) {
          if (!cancelled) setState({ kind: "no-cw" });
          return;
        }
        if (!cancelled) setState({ kind: "ready", notification: cw });
        // Load boards using the notification's creds.
        const cfg = cw.config as Record<string, string>;
        try {
          const b = await cwProxy<CwBoard[]>({
            cwApiUrl: String(cfg.cwApiUrl ?? ""),
            cwCompanyId: String(cfg.cwCompanyId ?? ""),
            cwClientId: String(cfg.cwClientId ?? ""),
            cwPublicKey: String(cfg.cwPublicKey ?? ""),
            cwPrivateKey: String(cfg.cwPrivateKey ?? ""),
            resource: "boards",
          });
          if (!cancelled) setBoards(b);
        } catch (e) {
          if (!cancelled) setStatusesError(e instanceof Error ? e.message : String(e));
        }
      } catch (e) {
        if (!cancelled) setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When boardId changes, refresh statuses for that board.
  useEffect(() => {
    if (state.kind !== "ready" || !boardId) {
      setStatuses(null);
      return;
    }
    let cancelled = false;
    setStatusesError(null);
    (async () => {
      try {
        const cfg = state.notification.config as Record<string, string>;
        const s = await cwProxy<CwStatus[]>({
          cwApiUrl: String(cfg.cwApiUrl ?? ""),
          cwCompanyId: String(cfg.cwCompanyId ?? ""),
          cwClientId: String(cfg.cwClientId ?? ""),
          cwPublicKey: String(cfg.cwPublicKey ?? ""),
          cwPrivateKey: String(cfg.cwPrivateKey ?? ""),
          resource: "statuses",
          boardId,
        });
        if (!cancelled) setStatuses(s);
      } catch (e) {
        if (!cancelled) setStatusesError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [boardId, state.kind === "ready" ? state.notification.id : null]);

  const canSave = useMemo(() => {
    if (!attached) return true; // Detaching is always valid
    return Boolean(boardId && downStatusId);
  }, [attached, boardId, downStatusId]);

  async function handleSave() {
    if (state.kind !== "ready") return;
    setSave({ kind: "saving" });
    try {
      const notifId = String(state.notification.id);
      const notificationIDList = attached ? { [notifId]: true } : { [notifId]: false };
      const cwConfig: CwConfig = attached
        ? {
            boardId,
            downStatusId,
            upStatusId,
            // Preserve activeTicketId if it was set by the provider — don't clobber.
            ...(initialConfig?.activeTicketId
              ? { activeTicketId: initialConfig.activeTicketId }
              : {}),
          }
        : {};
      await apiFetch(`/api/v1/monitors/${monitorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cwConfig, notificationIDList }),
      });
      setSave({ kind: "ok" });
    } catch (e) {
      setSave({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  if (state.kind === "loading") {
    return (
      <Card className="p-5 flex items-center gap-2 font-mono text-[12px] text-muted-fg">
        <Loader2 className="size-4 animate-spin" />
        Checking ConnectWise integration…
      </Card>
    );
  }

  if (state.kind === "no-cw") {
    return null; // Hidden when no CW notification exists; the Integrations page is the entry point.
  }

  if (state.kind === "error") {
    return (
      <Card className="p-5 text-error-fg font-mono text-[13px]">
        <AlertCircle className="inline size-4 mr-2" />
        Couldn't load CW config: {state.message}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <Briefcase className="size-4 text-fg" />
          <h3 className="font-mono text-sm font-semibold">ConnectWise ticketing</h3>
          {initialConfig?.activeTicketId ? (
            <Tag tone="warning">
              <Ticket className="size-3" />
              Active ticket #{initialConfig.activeTicketId}
            </Tag>
          ) : attached ? (
            <Tag tone="success">
              <CheckCircle2 className="size-3" />
              Wired
            </Tag>
          ) : (
            <Tag>Not attached</Tag>
          )}
        </div>
        <Link
          to="/integrations/connectwise"
          className="font-mono text-[11px] text-muted-fg hover:text-fg"
        >
          credentials →
        </Link>
      </div>

      <div className="flex flex-col gap-4 p-[18px]">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={attached}
            onChange={(e) => setAttached(e.target.checked)}
            className="size-4 rounded border-border bg-background"
          />
          <span className="font-mono text-[12px] text-fg">
            Open a ticket when this monitor goes DOWN
          </span>
        </label>

        {attached && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Picker
                label="Service board"
                value={boardId}
                onChange={(v) => {
                  setBoardId(v);
                  // Reset status pickers when board changes
                  setDownStatusId(undefined);
                  setUpStatusId(undefined);
                }}
                options={boards}
                placeholder={boards === null ? "Loading boards…" : "Pick a board"}
                disabled={!boards}
              />
              <Picker
                label="Status when DOWN"
                value={downStatusId}
                onChange={setDownStatusId}
                options={statuses}
                placeholder={
                  !boardId ? "Pick a board first" : statuses === null ? "Loading…" : "Pick status"
                }
                disabled={!boardId || !statuses}
              />
              <Picker
                label="Status when UP"
                value={upStatusId}
                onChange={setUpStatusId}
                options={statuses}
                placeholder={
                  !boardId ? "Pick a board first" : statuses === null ? "Loading…" : "(optional)"
                }
                disabled={!boardId || !statuses}
                allowClear
              />
            </div>

            {statusesError && (
              <div className="rounded-lg bg-error-bg px-3 py-2 text-[12px] text-error-fg font-mono break-all">
                <AlertCircle className="inline size-3.5 mr-1" />
                {statusesError}
              </div>
            )}

            <div className="text-[11px] text-muted-fg">
              Tickets land on the picked board with the down-status. When the monitor recovers, the
              same ticket gets bumped to the up-status (no duplicate).
            </div>
          </>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <button
            onClick={handleSave}
            disabled={!canSave || save.kind === "saving"}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-xs font-semibold text-primary-fg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {save.kind === "saving" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Save
          </button>
          {save.kind === "ok" && (
            <span className="font-mono text-[11px] text-success-fg inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              Saved
            </span>
          )}
          {save.kind === "error" && (
            <span className="font-mono text-[11px] text-error-fg inline-flex items-center gap-1">
              <AlertCircle className="size-3.5" />
              {save.msg}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function Picker<T extends { id: number; name: string }>({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  allowClear,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  options: T[] | null;
  placeholder: string;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-fg">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        disabled={disabled}
        className="w-full rounded-lg border border-input bg-bg px-3 py-2 text-fg focus:outline-none focus:border-primary text-[13px] font-mono disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {allowClear && value !== undefined && <option value="">— clear —</option>}
        {options?.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
