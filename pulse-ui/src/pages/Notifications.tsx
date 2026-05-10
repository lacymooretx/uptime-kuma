import { useEffect, useState } from "react";
import {
  Plus,
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  Phone,
  Send,
  Loader2,
  Slack,
  TestTube,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { Card, Tag } from "../components/ui";
import { fetchNotifications, type ApiNotification } from "../lib/api";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; list: ApiNotification[] };

const channelTypes: {
  type: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
}[] = [
  { type: "smtp", label: "Email (SMTP)", icon: Mail, description: "Plain-old email blasts to your inbox or a list" },
  { type: "slack", label: "Slack", icon: Slack, description: "Post to a channel via incoming webhook" },
  { type: "discord", label: "Discord", icon: MessageSquare, description: "Webhook to a channel or thread" },
  { type: "webhook", label: "Webhook", icon: Webhook, description: "POST JSON to your own endpoint" },
  { type: "twilio", label: "SMS (Twilio)", icon: Phone, description: "Text message blast for high-severity pages" },
  { type: "telegram", label: "Telegram", icon: Send, description: "Bot DM or group" },
];

export default function Notifications() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchNotifications();
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

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb active>Notifications</Crumb>
          </>
        }
        right={
          <>
            <LivePill />
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-[13px] font-medium text-primary-fg hover:opacity-90">
              <Plus className="size-4" strokeWidth={2.2} />
              Add channel
            </button>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-mono text-[28px] font-semibold leading-tight">Notifications</h1>
            <div className="text-[13px] text-muted-fg mt-1">
              Where Pulse sends pages when something breaks · attach to monitors individually or by tag
            </div>
          </div>

          {state.kind === "loading" && (
            <div className="flex items-center justify-center gap-2 py-12 font-mono text-[12px] text-muted-fg">
              <Loader2 className="size-4 animate-spin" /> Loading channels…
            </div>
          )}

          {state.kind === "error" && (
            <Card className="p-6 text-center font-mono text-[13px] text-error-fg">
              Couldn't load — {state.message}
            </Card>
          )}

          {/* Active channels */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-muted-fg">CONFIGURED</span>
              <span className="font-mono text-[11px] text-muted-fg">{list.length} channels</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {list.length === 0 && state.kind === "ready" && (
              <Card className="p-8 flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
                  <Bell className="size-5 text-muted-fg" />
                </div>
                <h2 className="font-mono text-sm font-semibold">No channels configured</h2>
                <p className="max-w-sm text-[12px] text-muted-fg">
                  Without a notification channel, Pulse can show alerts in-app and on the status
                  page but can't reach you when you're off-screen.
                </p>
              </Card>
            )}

            {list.length > 0 && (
              <Card className="overflow-hidden p-0">
                <ul>
                  {list.map((n, i) => (
                    <li
                      key={n.id}
                      className={[
                        "flex items-center gap-4 px-[18px] py-3.5",
                        i < list.length - 1 ? "border-b border-border" : "",
                      ].join(" ")}
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-info-bg text-info-fg">
                        <Bell className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[13px] font-semibold">{n.name}</div>
                        <div className="font-mono text-[11px] text-muted-fg">
                          {n.type} {n.isDefault && "· default for new monitors"}
                        </div>
                      </div>
                      <Tag tone={n.active ? "success" : "neutral"}>
                        {n.active ? "ACTIVE" : "DISABLED"}
                      </Tag>
                      <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-[11px] text-secondary-fg hover:bg-secondary/80">
                        <TestTube className="size-3" /> Test
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Add channel grid */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-muted-fg">ADD A CHANNEL</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {channelTypes.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.type}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-card/80 hover:border-muted-fg"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <Icon className="size-5 text-fg" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[13px] font-semibold">{c.label}</div>
                      <div className="text-[12px] text-muted-fg">{c.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
