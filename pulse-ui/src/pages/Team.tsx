import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { Card, Avatar, Tag } from "../components/ui";
import { Plus, Calendar, ShieldCheck, Phone } from "lucide-react";

const rotation = [
  { initials: "LM", name: "Lacy Moore", role: "Primary", from: "Sat 4pm", to: "Sun 8am", current: true },
  { initials: "RC", name: "Riley Chen", role: "Secondary (escalation)", from: "Sat 4pm", to: "Sun 8am" },
  { initials: "MK", name: "Morgan Kerr", role: "Primary", from: "Sun 8am", to: "Mon 8am" },
  { initials: "JS", name: "Jordan Sato", role: "Primary", from: "Mon 8am", to: "Tue 8am" },
  { initials: "AV", name: "Avery Vasquez", role: "Primary", from: "Tue 8am", to: "Wed 8am" },
];

const members = [
  { initials: "LM", name: "Lacy Moore", email: "lacy@aspendora.com", role: "Owner", oncall: true },
  { initials: "RC", name: "Riley Chen", email: "riley@aspendora.com", role: "Engineer" },
  { initials: "MK", name: "Morgan Kerr", email: "morgan@aspendora.com", role: "Engineer" },
  { initials: "JS", name: "Jordan Sato", email: "jordan@aspendora.com", role: "Engineer" },
  { initials: "AV", name: "Avery Vasquez", email: "avery@aspendora.com", role: "Read-only" },
];

export default function Team() {
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
        right={
          <>
            <LivePill />
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-mono text-[13px] font-medium text-primary-fg hover:opacity-90">
              <Plus className="size-4" strokeWidth={2.2} />
              Invite member
            </button>
          </>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-mono text-[28px] font-semibold leading-tight">Team & On-call</h1>
            <div className="text-[13px] text-muted-fg mt-1">
              Workspace members and the rotation that decides who gets paged when something breaks
            </div>
          </div>

          {/* Current on-call hero */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar initials="LM" size={64} />
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-success-bg ring-2 ring-card">
                    <ShieldCheck className="size-3 text-success-fg" />
                  </span>
                </div>
                <div>
                  <div className="font-mono text-xl font-semibold">Lacy Moore</div>
                  <div className="font-mono text-[12px] text-muted-fg mt-0.5">
                    on duty · primary · 4h 12m left in shift
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Tag tone="success">
                      <span className="size-1.5 rounded-full bg-success-fg" />
                      receiving pages
                    </Tag>
                    <Tag tone="info">escalates to Riley · 14m</Tag>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
                  <Phone className="size-3.5" /> Test page
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 font-mono text-xs text-secondary-fg hover:bg-secondary/80">
                  Override
                </button>
              </div>
            </div>
          </Card>

          {/* Rotation timeline */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-[18px] py-3.5">
              <div className="flex items-center gap-2.5">
                <Calendar className="size-4 text-muted-fg" />
                <h3 className="font-mono text-sm font-semibold">Rotation</h3>
                <span className="font-mono text-[11px] text-muted-fg">next 5 shifts</span>
              </div>
              <button className="font-mono text-[11px] text-muted-fg hover:text-fg">
                edit schedule →
              </button>
            </div>
            <ul>
              {rotation.map((shift, i) => (
                <li
                  key={i}
                  className={[
                    "flex items-center gap-4 px-[18px] py-3",
                    i < rotation.length - 1 ? "border-b border-border" : "",
                    shift.current ? "bg-success-bg/20" : "",
                  ].join(" ")}
                >
                  <Avatar initials={shift.initials} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[13px] font-semibold">{shift.name}</div>
                    <div className="font-mono text-[11px] text-muted-fg">{shift.role}</div>
                  </div>
                  <div className="font-mono text-[11px] text-muted-fg">
                    {shift.from} → {shift.to}
                  </div>
                  {shift.current && <Tag tone="success">on duty</Tag>}
                </li>
              ))}
            </ul>
          </Card>

          {/* Members */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-muted-fg">MEMBERS</span>
              <span className="font-mono text-[11px] text-muted-fg">{members.length} workspace users</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Card className="overflow-hidden p-0">
              <div className="grid grid-cols-[40px_1fr_240px_120px_80px] items-center gap-4 border-b border-border px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
                <div></div>
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div className="text-right">Status</div>
              </div>
              {members.map((m, i) => (
                <div
                  key={m.email}
                  className={[
                    "grid grid-cols-[40px_1fr_240px_120px_80px] items-center gap-4 px-5 py-3",
                    i < members.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <Avatar initials={m.initials} size={28} tone={m.oncall ? "primary" : "secondary"} />
                  <div className="font-mono text-[13px] font-semibold">{m.name}</div>
                  <div className="truncate font-mono text-[12px] text-muted-fg">{m.email}</div>
                  <div>
                    <Tag tone={m.role === "Owner" ? "primary" : m.role === "Read-only" ? "neutral" : "neutral"}>
                      {m.role}
                    </Tag>
                  </div>
                  <div className="text-right">
                    {m.oncall ? <Tag tone="success">on call</Tag> : <span className="text-[11px] text-muted-fg">—</span>}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <div className="rounded-2xl border border-dashed border-border p-4 text-[12px] text-muted-fg">
            <strong className="font-mono text-fg">Note:</strong> rotation, members, and on-call assignment
            aren't in the v1 REST API yet. The values shown are concept data illustrating where the feature
            will live; once <code className="font-mono">/api/v1/team</code> ships this page will read from it.
          </div>
        </div>
      </div>
    </>
  );
}
