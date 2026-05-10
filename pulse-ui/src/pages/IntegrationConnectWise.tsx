import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
  TestTube,
  AlertCircle,
} from "lucide-react";
import { Topbar, Crumb, CrumbSep } from "../components/Topbar";
import { Card, Tag } from "../components/ui";
import {
  fetchNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  cwProxy,
  type ApiNotification,
} from "../lib/api";

type FormState = {
  name: string;
  cwApiUrl: string;
  cwCompanyId: string;
  cwClientId: string;
  cwPublicKey: string;
  cwPrivateKey: string;
  isDefault: boolean;
};

const empty: FormState = {
  name: "ConnectWise Manage",
  cwApiUrl: "https://api-na.myconnectwise.net/v4_6_release/apis/3.0",
  cwCompanyId: "",
  cwClientId: "",
  cwPublicKey: "",
  cwPrivateKey: "",
  isDefault: false,
};

type Status =
  | { kind: "loading" }
  | { kind: "ready"; existing: ApiNotification | null }
  | { kind: "error"; message: string };

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "ok"; msg: string }
  | { kind: "error"; msg: string };

export default function IntegrationConnectWise() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [form, setForm] = useState<FormState>(empty);
  const [save, setSave] = useState<SaveStatus>({ kind: "idle" });
  const [test, setTest] = useState<SaveStatus>({ kind: "idle" });

  async function refresh() {
    try {
      const list = await fetchNotifications();
      const cw = list.find((n) => n.type === "ConnectWiseManage") ?? null;
      setStatus({ kind: "ready", existing: cw });
      if (cw) {
        const c = cw.config as Record<string, string | boolean>;
        setForm({
          name: cw.name,
          cwApiUrl: String(c.cwApiUrl ?? empty.cwApiUrl),
          cwCompanyId: String(c.cwCompanyId ?? ""),
          cwClientId: String(c.cwClientId ?? ""),
          // Keep secrets visible in the form so users can verify what's saved.
          // The /api/v1/notifications endpoint already requires auth.
          cwPublicKey: String(c.cwPublicKey ?? ""),
          cwPrivateKey: String(c.cwPrivateKey ?? ""),
          isDefault: cw.isDefault,
        });
      }
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave() {
    setSave({ kind: "saving" });
    try {
      const body = {
        type: "ConnectWiseManage",
        name: form.name,
        cwApiUrl: form.cwApiUrl,
        cwCompanyId: form.cwCompanyId,
        cwClientId: form.cwClientId,
        cwPublicKey: form.cwPublicKey,
        cwPrivateKey: form.cwPrivateKey,
        isDefault: form.isDefault,
        applyExisting: false,
      };
      const existing = status.kind === "ready" ? status.existing : null;
      if (existing) {
        await updateNotification(existing.id, body);
      } else {
        await createNotification(body);
      }
      setSave({ kind: "ok", msg: existing ? "Updated" : "Created" });
      await refresh();
    } catch (e) {
      setSave({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleTest() {
    setTest({ kind: "saving" });
    try {
      const boards = await cwProxy<{ id: number; name: string }[]>({
        cwApiUrl: form.cwApiUrl,
        cwCompanyId: form.cwCompanyId,
        cwClientId: form.cwClientId,
        cwPublicKey: form.cwPublicKey,
        cwPrivateKey: form.cwPrivateKey,
        resource: "boards",
      });
      setTest({
        kind: "ok",
        msg: `Connected — ${boards.length} service boards visible: ${boards.slice(0, 3).map((b) => b.name).join(", ")}${boards.length > 3 ? "…" : ""}`,
      });
    } catch (e) {
      setTest({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleDelete() {
    if (status.kind !== "ready" || !status.existing) return;
    if (!confirm("Delete this ConnectWise notification? Monitors using it will stop creating tickets.")) return;
    await deleteNotification(status.existing.id);
    setForm(empty);
    setSave({ kind: "idle" });
    setTest({ kind: "idle" });
    await refresh();
  }

  const existing = status.kind === "ready" ? status.existing : null;

  return (
    <>
      <Topbar
        left={
          <>
            <Link to="/integrations" className="flex items-center gap-1 text-muted-fg hover:text-fg">
              <ArrowLeft className="size-4" />
            </Link>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Link to="/integrations" className="font-mono text-[13px] text-muted-fg hover:text-fg">
              Integrations
            </Link>
            <CrumbSep />
            <Crumb active>ConnectWise PSA</Crumb>
          </>
        }
        right={
          existing ? (
            <Tag tone="success">
              <CheckCircle2 className="size-3" />
              Connected
            </Tag>
          ) : (
            <Tag>Not configured</Tag>
          )
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-5 max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Briefcase className="size-6 text-fg" />
            </div>
            <div>
              <h1 className="font-mono text-[28px] font-semibold leading-tight">ConnectWise PSA</h1>
              <p className="mt-1 text-[13px] text-muted-fg">
                When a monitor goes down, Pulse opens a ticket on the configured service board.
                When it recovers, the ticket auto-resolves. Per-monitor board/status overrides
                live on each Monitor's edit page.
              </p>
            </div>
          </div>

          {status.kind === "loading" && (
            <div className="flex items-center gap-2 font-mono text-[12px] text-muted-fg">
              <Loader2 className="size-4 animate-spin" /> Loading existing config…
            </div>
          )}

          {status.kind === "error" && (
            <Card className="p-5 text-error-fg font-mono text-[13px]">
              <AlertCircle className="inline size-4 mr-2" />
              Couldn't load notifications: {status.message}
            </Card>
          )}

          {status.kind === "ready" && (
            <>
              <Card className="p-5 flex flex-col gap-4">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
                  Connection
                </div>

                <Field
                  label="Display name"
                  hint="Shown in monitor pickers"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                />
                <Field
                  label="API URL"
                  hint="Use the v4_6_release/apis/3.0 path. Find your region's URL at developer.connectwise.com."
                  value={form.cwApiUrl}
                  onChange={(v) => setForm({ ...form, cwApiUrl: v })}
                  mono
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Company ID"
                    hint="Your CW tenant identifier"
                    value={form.cwCompanyId}
                    onChange={(v) => setForm({ ...form, cwCompanyId: v })}
                  />
                  <Field
                    label="Client ID"
                    hint="Integration registration"
                    value={form.cwClientId}
                    onChange={(v) => setForm({ ...form, cwClientId: v })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Public key"
                    hint="Member API key — public half"
                    value={form.cwPublicKey}
                    onChange={(v) => setForm({ ...form, cwPublicKey: v })}
                    type="password"
                  />
                  <Field
                    label="Private key"
                    hint="Member API key — private half"
                    value={form.cwPrivateKey}
                    onChange={(v) => setForm({ ...form, cwPrivateKey: v })}
                    type="password"
                  />
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="size-4 rounded border-border bg-background"
                  />
                  <span className="font-mono text-[12px] text-fg">
                    Apply to <strong>new</strong> monitors automatically
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <button
                    onClick={handleSave}
                    disabled={save.kind === "saving" || !form.cwApiUrl || !form.cwCompanyId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-xs font-semibold text-primary-fg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {save.kind === "saving" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    {existing ? "Save changes" : "Create"}
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={test.kind === "saving" || !form.cwApiUrl || !form.cwCompanyId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {test.kind === "saving" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <TestTube className="size-3.5" />
                    )}
                    Test connection
                  </button>
                  {existing && (
                    <button
                      onClick={handleDelete}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 font-mono text-xs text-error-fg hover:bg-error-bg/40"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  )}
                </div>

                {save.kind === "ok" && (
                  <StatusBanner tone="success" msg={save.msg} />
                )}
                {save.kind === "error" && (
                  <StatusBanner tone="error" msg={"Save failed: " + save.msg} />
                )}
                {test.kind === "ok" && (
                  <StatusBanner tone="success" msg={test.msg} />
                )}
                {test.kind === "error" && (
                  <StatusBanner tone="error" msg={"Test failed: " + test.msg} />
                )}
              </Card>

              <Card className="p-5 flex flex-col gap-3">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
                  How tickets get routed
                </div>
                <ol className="text-[13px] text-muted-fg space-y-2 list-decimal pl-5">
                  <li>Save the credentials above and verify with <strong>Test connection</strong>.</li>
                  <li>
                    On each monitor that should open tickets, attach this notification and pick a
                    board / down-status / up-status (Monitor edit → Notifications). The full
                    board/status picker lives on the monitor page because each service likely
                    routes to a different team.
                  </li>
                  <li>
                    When the monitor goes DOWN, Pulse posts to <code className="font-mono text-fg">/service/tickets</code>
                    with the configured board+status; the ticket ID is stored on the monitor so
                    when the monitor recovers, that same ticket gets a status update instead of
                    a duplicate being created.
                  </li>
                </ol>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  mono = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "password";
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-fg">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-input bg-bg px-3 py-2 text-fg focus:outline-none focus:border-primary text-[13px] ${mono ? "font-mono" : ""}`}
      />
      {hint && <span className="text-[11px] text-muted-fg">{hint}</span>}
    </div>
  );
}

function StatusBanner({ tone, msg }: { tone: "success" | "error"; msg: string }) {
  const cls = tone === "success" ? "bg-success-bg text-success-fg" : "bg-error-bg text-error-fg";
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-[12px] ${cls}`}>
      <Icon className="size-4 shrink-0 mt-0.5" />
      <span className="font-mono break-all">{msg}</span>
    </div>
  );
}
