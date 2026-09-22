import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { Card, Avatar, Tag } from "../components/ui";
import { ShieldOff, Users } from "lucide-react";
import { getUser } from "../lib/auth";

export default function Team() {
  const user = getUser();

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb active>Team & On-call</Crumb>
          </>
        }
        right={<LivePill />}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-mono text-[28px] font-semibold leading-tight">Team & On-call</h1>
            <div className="text-[13px] text-muted-fg mt-1">
              Who's signed in to this workspace. On-call rotation is not part of Uptime Kuma.
            </div>
          </div>

          {/* Signed-in user (the one piece of real identity we have) */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Avatar initials={user?.initials ?? "?"} size={56} tone="primary" />
              <div>
                <div className="font-mono text-lg font-semibold">
                  {user?.username ?? "Not signed in"}
                </div>
                <div className="font-mono text-[12px] text-muted-fg mt-0.5">
                  signed in via Entra ID (OIDC)
                </div>
                <div className="mt-2">
                  <Tag tone="success">
                    <span className="size-1.5 rounded-full bg-success-fg" />
                    active session
                  </Tag>
                </div>
              </div>
            </div>
          </Card>

          {/* On-call: honest empty state — no Kuma backend for this */}
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
              <ShieldOff className="size-5 text-muted-fg" />
            </span>
            <div className="font-mono text-sm font-semibold">On-call rotation not configured</div>
            <p className="max-w-md text-[12px] leading-relaxed text-muted-fg">
              Uptime Kuma has no concept of on-call schedules or escalation. Paging is handled
              per-monitor by the notification channels you configure under{" "}
              <span className="font-mono text-fg">Notifications</span>. A dedicated rotation would
              require a <code className="font-mono">/api/v1/team</code> backend that doesn't exist yet.
            </p>
          </Card>

          {/* Members: honest empty state — Kuma's user list isn't exposed via /api/v1 */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-muted-fg">
                MEMBERS
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <Users className="size-5 text-muted-fg" />
              <div className="font-mono text-[13px] font-semibold">Workspace roster unavailable</div>
              <p className="max-w-md text-[12px] leading-relaxed text-muted-fg">
                Uptime Kuma's user accounts aren't exposed through the v1 REST API, so Pulse can't
                list them. Manage users in the classic Uptime Kuma settings.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
