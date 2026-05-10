import { Link } from "react-router-dom";
import { Topbar, Crumb, CrumbSep, LivePill } from "../components/Topbar";
import { Card, Tag } from "../components/ui";
import {
  Slack,
  Github,
  Plug,
  MessageCircle,
  AlertTriangle,
  Briefcase,
  Sparkles,
  Database,
  Webhook,
  CheckCircle2,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Integration = {
  id: string;
  name: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  category: string;
  description: string;
  status: "connected" | "available" | "coming-soon";
  detail?: string;
  configurePath?: string;
};

const integrations: Integration[] = [
  {
    id: "connectwise",
    name: "ConnectWise PSA",
    icon: Briefcase,
    category: "Ticketing",
    description: "Auto-open tickets when a monitor is down longer than the SLO threshold.",
    status: "available",
    configurePath: "/integrations/connectwise",
  },
  {
    id: "oidc-entra",
    name: "Microsoft Entra ID",
    icon: Sparkles,
    category: "Identity",
    description: "Single sign-on via OIDC. Auto-provision users by group membership.",
    status: "connected",
    detail: "tenant configured · group-gated",
  },
  {
    id: "slack",
    name: "Slack",
    icon: Slack,
    category: "Notifications",
    description: "Post incidents and recoveries to a Slack channel via incoming webhook.",
    status: "available",
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    icon: AlertTriangle,
    category: "On-call",
    description: "Page the on-call engineer when severity ≥ critical. Auto-resolves on recovery.",
    status: "available",
  },
  {
    id: "discord",
    name: "Discord",
    icon: MessageCircle,
    category: "Notifications",
    description: "Send incident updates to a Discord channel webhook.",
    status: "available",
  },
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    category: "Source",
    description: "Annotate the latency chart with deploy markers from your default-branch pushes.",
    status: "coming-soon",
  },
  {
    id: "datadog",
    name: "Datadog",
    icon: Database,
    category: "Observability",
    description: "Send Pulse beats to Datadog as custom metrics for unified dashboards.",
    status: "coming-soon",
  },
  {
    id: "webhook",
    name: "Generic webhook",
    icon: Webhook,
    category: "Notifications",
    description: "POST a JSON payload to any URL when an incident opens or closes.",
    status: "available",
  },
];

const categories = Array.from(new Set(integrations.map((i) => i.category)));

const statusBadge = (s: Integration["status"]) => {
  if (s === "connected") {
    return (
      <Tag tone="success">
        <CheckCircle2 className="size-3" />
        Connected
      </Tag>
    );
  }
  if (s === "coming-soon") return <Tag tone="neutral">Coming soon</Tag>;
  return <Tag tone="neutral">Not configured</Tag>;
};

export default function Integrations() {
  const connected = integrations.filter((i) => i.status === "connected").length;

  return (
    <>
      <Topbar
        left={
          <>
            <Crumb>aspendora</Crumb>
            <CrumbSep />
            <Crumb active>Integrations</Crumb>
          </>
        }
        right={<LivePill />}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-mono text-[28px] font-semibold leading-tight">Integrations</h1>
            <div className="text-[13px] text-muted-fg mt-1">
              {connected} connected · {integrations.length - connected} available · plug Pulse into the rest of your stack
            </div>
          </div>

          {categories.map((cat) => (
            <div key={cat} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-muted-fg">
                  {cat.toUpperCase()}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {integrations
                  .filter((i) => i.category === cat)
                  .map((i) => {
                    const Icon = i.icon;
                    const disabled = i.status === "coming-soon";
                    return (
                      <Card
                        key={i.id}
                        className={`p-4 flex flex-col gap-3 transition-opacity ${disabled ? "opacity-60" : "hover:bg-card/80 cursor-pointer"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                            <Icon className="size-5 text-fg" />
                          </div>
                          {statusBadge(i.status)}
                        </div>
                        <div>
                          <div className="font-mono text-[14px] font-semibold">{i.name}</div>
                          <div className="text-[12px] text-muted-fg leading-relaxed mt-1">
                            {i.description}
                          </div>
                          {i.detail && (
                            <div className="font-mono text-[11px] text-success-fg mt-2">
                              {i.detail}
                            </div>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-end gap-2">
                          {i.status === "connected" && (i.configurePath ? (
                            <Link
                              to={i.configurePath}
                              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-[11px] text-secondary-fg hover:bg-secondary/80"
                            >
                              Configure
                            </Link>
                          ) : (
                            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-[11px] text-secondary-fg hover:bg-secondary/80">
                              Configure
                            </button>
                          ))}
                          {i.status === "available" && (i.configurePath ? (
                            <Link
                              to={i.configurePath}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-mono text-[11px] font-semibold text-primary-fg hover:opacity-90"
                            >
                              <Plug className="size-3" />
                              Connect
                            </Link>
                          ) : (
                            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-mono text-[11px] font-semibold text-primary-fg hover:opacity-90">
                              <Plug className="size-3" />
                              Connect
                            </button>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-dashed border-border p-4 text-[12px] text-muted-fg">
            <strong className="font-mono text-fg">Note:</strong> only the two "Connected" integrations
            currently exist in the backend. The rest are concept cards illustrating the integration
            surface — they'll light up as the underlying handlers ship.
          </div>
        </div>
      </div>
    </>
  );
}
