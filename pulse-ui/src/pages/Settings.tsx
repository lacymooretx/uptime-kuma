import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Key,
  Shield,
  Brush,
  Database,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { Card, Tag, StatLabel } from "../components/ui";
import { fetchApiKeys, fetchSettings, type ApiKey, type ApiSettings } from "../lib/api";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; keys: ApiKey[]; settings: ApiSettings };

const sections = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "keys", label: "API Keys", icon: Key },
  { id: "security", label: "Security", icon: Shield },
  { id: "branding", label: "Branding", icon: Brush },
  { id: "data", label: "Data & Backup", icon: Database },
];

export default function SettingsPage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [section, setSection] = useState("general");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [keys, settings] = await Promise.all([fetchApiKeys(), fetchSettings()]);
        if (!cancelled) setState({ kind: "ready", keys, settings });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb active>Settings</Crumb>
          </>
        }
        right={<LivePill />}
      />

      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* Section nav */}
        <aside className="w-[220px] shrink-0 border-r border-border bg-bg p-4 flex flex-col gap-1">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                  isActive
                    ? "bg-secondary text-fg font-medium"
                    : "text-muted-fg hover:text-fg hover:bg-secondary/40",
                ].join(" ")}
              >
                <Icon className="size-4" />
                {s.label}
              </button>
            );
          })}
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-y-auto px-7 py-6">
          <div className="flex flex-col gap-5 max-w-3xl">
            <div>
              <h1 className="font-mono text-[28px] font-semibold leading-tight">
                {sections.find((s) => s.id === section)?.label}
              </h1>
              <div className="text-[13px] text-muted-fg mt-1">
                Workspace-wide settings for Pulse and the underlying Uptime Kuma server
              </div>
            </div>

            {state.kind === "loading" && (
              <div className="flex items-center gap-2 font-mono text-[12px] text-muted-fg">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            )}

            {state.kind === "error" && (
              <Card className="p-6 text-center font-mono text-[13px] text-error-fg">
                Couldn't load — {state.message}
              </Card>
            )}

            {state.kind === "ready" && section === "general" && (
              <Card className="p-5 flex flex-col gap-4">
                <Field label="Workspace title" value={state.settings.customTitle ?? "Uptime Kuma"} />
                <Field label="Custom logo URL" value={state.settings.customLogo ?? "—"} />
                <Field label="Server timezone" value={state.settings.serverTimezone ?? "UTC"} />
                <Field
                  label="Data retention"
                  value={
                    state.settings.keepDataPeriodDays
                      ? `${state.settings.keepDataPeriodDays} days`
                      : "default"
                  }
                />
              </Card>
            )}

            {state.kind === "ready" && section === "keys" && (
              <Card className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
                  <div>
                    <h3 className="font-mono text-sm font-semibold">API keys</h3>
                    <div className="text-[11px] text-muted-fg mt-0.5">
                      Use as <span className="font-mono">Authorization: Basic …</span> on /api/v1
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
                    <Plus className="size-3.5" /> New key
                  </button>
                </div>
                <ul>
                  {state.keys.map((k, i) => (
                    <li
                      key={k.id}
                      className={[
                        "flex items-center gap-4 px-[18px] py-3",
                        i < state.keys.length - 1 ? "border-b border-border" : "",
                      ].join(" ")}
                    >
                      <Key className="size-4 text-muted-fg" />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[13px] font-semibold">{k.name}</div>
                        <div className="font-mono text-[11px] text-muted-fg">
                          created {k.createdDate} · expires {k.expires}
                        </div>
                      </div>
                      <Tag tone={k.status === "active" ? "success" : "neutral"}>
                        {k.status.toUpperCase()}
                      </Tag>
                      <button className="text-muted-fg hover:text-error-fg">
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                  {state.keys.length === 0 && (
                    <li className="px-[18px] py-8 text-center font-mono text-[12px] text-muted-fg">
                      No API keys yet
                    </li>
                  )}
                </ul>
              </Card>
            )}

            {state.kind === "ready" && section === "security" && (
              <Card className="p-5 flex flex-col gap-4">
                <Field label="OIDC provider" value="Microsoft Entra ID" valueAccent="success" />
                <Field
                  label="Required group"
                  value={"set via OIDC_REQUIRED_GROUP env var"}
                />
                <Field label="2FA" value="enforced via Entra ID conditional access" />
                <Field label="Session length" value="JWT — invalidated on password change" />
              </Card>
            )}

            {state.kind === "ready" && section === "branding" && (
              <Card className="p-5 flex flex-col gap-4">
                <Field label="Brand color" value="#FF8400 (Aspendora orange)" />
                <Field label="Logo" value={state.settings.customLogo ?? "—"} />
                <Field label="Mode" value="Dark (NOC default)" />
                <Field label="Status page theme" value="inherits brand" />
              </Card>
            )}

            {state.kind === "ready" && section === "data" && (
              <div className="flex flex-col gap-4">
                <Card className="p-5 flex flex-col gap-3">
                  <StatLabel>Database</StatLabel>
                  <Field label="Engine" value="PostgreSQL 16" />
                  <Field
                    label="Retention"
                    value={`${state.settings.keepDataPeriodDays ?? 365} days of beats`}
                  />
                </Card>
                <Card className="p-5 flex flex-col gap-3">
                  <StatLabel>Backup</StatLabel>
                  <Field label="Strategy" value="Volume snapshot via Docker host" />
                  <Field label="Last backup" value="—" />
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  valueAccent,
}: {
  label: string;
  value: string;
  valueAccent?: "success" | "warning" | "error";
}) {
  const cls = {
    success: "text-success-fg",
    warning: "text-warning-fg",
    error: "text-error-fg",
    undefined: "text-fg",
  }[valueAccent ?? "undefined"];
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-fg">{label}</span>
      <span className={`font-mono text-[13px] ${cls}`}>{value}</span>
    </div>
  );
}
