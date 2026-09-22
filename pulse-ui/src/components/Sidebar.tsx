import { NavLink, useMatch } from "react-router-dom";
import {
  Radar,
  Search,
  LayoutDashboard,
  Activity,
  Siren,
  Globe,
  Wrench,
  Bell,
  Puzzle,
  Users,
  Settings,
  ChevronsUpDown,
  Pin,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { useFleet } from "../hooks/useFleet";
import { useIncidents } from "../hooks/useIncidents";
import { useStatusPages } from "../hooks/useStatusPages";
import { getUser } from "../lib/auth";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  to: string;
  label: string;
  icon: Icon;
  badge?: { text: string; tone?: "destructive" | "default" };
};

// Only show a badge when the count is meaningful (>0). The Incidents badge is
// destructive-toned so it stands out when something is genuinely active, and
// disappears entirely when the fleet is all clear.
function countBadge(
  n: number,
  tone?: "destructive" | "default",
): NavItem["badge"] {
  return n > 0 ? { text: String(n), tone } : undefined;
}

const setupNav: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/integrations", label: "Integrations", icon: Puzzle },
  { to: "/team", label: "Team & On-call", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavRow({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-fg font-medium"
            : "text-sidebar-muted hover:text-sidebar-fg hover:bg-sidebar-accent/40",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className="size-[18px] shrink-0"
            strokeWidth={isActive ? 2.2 : 1.6}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span
              className={[
                "rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums",
                item.badge.tone === "destructive"
                  ? "bg-destructive text-white font-semibold"
                  : "text-current/80",
              ].join(" ")}
            >
              {item.badge.text}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="px-2 pb-1.5 pt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-sidebar-muted">
      {label}
    </div>
  );
}

export default function Sidebar() {
  const onMonitorDetail = useMatch("/monitors/:slug");
  const fleet = useFleet();
  const incidents = useIncidents();
  const statusPages = useStatusPages();

  const monitorCount = fleet.kind === "ready" ? fleet.data.total : 0;
  const activeIncidents =
    incidents.kind === "ready" ? incidents.data.active.length : 0;
  const statusPageCount =
    statusPages.kind === "ready" ? statusPages.list.length : 0;
  const user = getUser();

  const workspaceNav: NavItem[] = [
    { to: "/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/monitors", label: "Monitors", icon: Activity, badge: countBadge(monitorCount) },
    { to: "/incidents", label: "Incidents", icon: Siren, badge: countBadge(activeIncidents, "destructive") },
    { to: "/status-pages", label: "Status Pages", icon: Globe, badge: countBadge(statusPageCount) },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
  ];

  const pinnedMonitors =
    fleet.kind === "ready" ? fleet.data.monitors.slice(0, 3) : [];
  const showPinned = !!onMonitorDetail && pinnedMonitors.length > 0;

  return (
    <aside className="w-[248px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-fg flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
          <Radar className="size-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="font-mono text-base font-semibold text-sidebar-accent-fg">Pulse</div>
          <div className="truncate text-[11px] text-sidebar-muted">aspendora workspace</div>
        </div>
      </div>

      <div className="border-t border-sidebar-border" />

      <div className="px-4 py-4">
        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 py-2.5">
          <Search className="size-4 text-sidebar-muted" />
          <input
            placeholder="Search monitors"
            className="flex-1 bg-transparent text-[13px] text-sidebar-muted placeholder:text-sidebar-muted focus:outline-none focus:text-sidebar-fg"
          />
          <kbd className="font-mono text-[11px] text-sidebar-muted">⌘K</kbd>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3">
        <Section label={showPinned ? "Workspace" : "Workspace"} />
        {workspaceNav.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}

        {showPinned && (
          <>
            <Section label="Pinned monitors" />
            {pinnedMonitors.map((m) => (
              <NavLink
                key={m.slug}
                to={`/monitors/${m.slug}`}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-mono transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-fg"
                      : "text-sidebar-muted hover:text-sidebar-fg hover:bg-sidebar-accent/40",
                  ].join(" ")
                }
              >
                <span
                  className={[
                    "inline-block size-1.5 rounded-full",
                    m.status === "down"
                      ? "bg-destructive"
                      : m.status === "degraded"
                        ? "bg-warning-fg"
                        : "bg-success-fg",
                  ].join(" ")}
                />
                <span className="flex-1 truncate">{m.name}</span>
                <span
                  className={[
                    "text-[10px]",
                    m.status === "down"
                      ? "text-destructive"
                      : m.status === "degraded"
                        ? "text-warning-fg"
                        : "text-sidebar-muted",
                  ].join(" ")}
                >
                  {m.status === "down" ? "down" : `${m.latencyMs}ms`}
                </span>
              </NavLink>
            ))}
          </>
        )}

        <Section label="Setup" />
        {setupNav.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary font-mono text-[11px] font-semibold text-primary-fg">
          {user?.initials ?? "?"}
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="truncate text-[13px] font-medium text-sidebar-accent-fg">
            {user?.username ?? "Not signed in"}
          </div>
          <div className="truncate font-mono text-[11px] text-sidebar-muted">signed in</div>
        </div>
        <ChevronsUpDown className="size-4 text-sidebar-muted" />
        <Pin className="hidden size-3 text-sidebar-muted" />
      </div>
    </aside>
  );
}
