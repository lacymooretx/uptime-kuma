import {
  ArrowLeft,
  Link as LinkIcon,
  ExternalLink,
  Megaphone,
  CheckCircle2,
  GripVertical,
  Info,
  AlertOctagon,
  Grid3x3,
  History,
  MailOpen,
  Plus,
  Eye,
  MoreHorizontal,
  Laptop,
  Smartphone,
} from "lucide-react";
import { Topbar, Crumb, CrumbSep, UnsavedPill } from "../components/Topbar";
import StatusPagePreview, { PreviewWindow } from "../components/StatusPagePreview";

type Section = {
  id: string;
  icon: typeof Info;
  label: string;
  detail: string;
  highlight?: boolean;
};

const sections: Section[] = [
  { id: "banner", icon: Info, label: "Status banner", detail: "shows current overall status" },
  {
    id: "active",
    icon: AlertOctagon,
    label: "Active incident",
    detail: "auto · service-log down 7m",
    highlight: true,
  },
  { id: "services", icon: Grid3x3, label: "Service health", detail: "7 services · 90-day strips" },
  { id: "past", icon: History, label: "Past incidents", detail: "last 30 days · grouped by day" },
  { id: "subscribe", icon: MailOpen, label: "Subscribe", detail: "email + RSS · webhook off" },
];

function SectionRow({ section }: { section: Section }) {
  const Icon = section.icon;
  return (
    <div
      className={[
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 border",
        section.highlight
          ? "border-warning-fg bg-warning-bg"
          : "border-border bg-transparent",
      ].join(" ")}
    >
      <GripVertical
        className={`size-4 ${section.highlight ? "text-warning-fg" : "text-muted-fg"}`}
        strokeWidth={1.6}
      />
      <Icon
        className={`size-4 ${section.highlight ? "text-warning-fg" : "text-fg"}`}
      />
      <div className="flex-1 min-w-0 leading-tight">
        <div
          className={[
            "truncate font-mono text-xs",
            section.highlight ? "font-semibold text-warning-fg" : "font-medium text-fg",
          ].join(" ")}
        >
          {section.label}
        </div>
        <div
          className={[
            "truncate text-[10px]",
            section.highlight ? "text-warning-fg" : "text-muted-fg",
          ].join(" ")}
        >
          {section.detail}
        </div>
      </div>
      {section.highlight ? (
        <MoreHorizontal className="size-3.5 text-warning-fg" />
      ) : (
        <Eye className="size-3.5 text-muted-fg" />
      )}
    </div>
  );
}

export default function StatusPageComposer() {
  return (
    <>
      <Topbar
        left={
          <>
            <ArrowLeft className="size-4 text-muted-fg" />
            <Crumb>Status pages</Crumb>
            <CrumbSep />
            <Crumb active>status.aspendora.com</Crumb>
            <UnsavedPill />
          </>
        }
        right={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80">
              <LinkIcon className="size-3.5" /> Copy URL
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-2 font-mono text-xs font-medium text-secondary-fg hover:bg-secondary/80">
              <ExternalLink className="size-3.5" /> View live
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-mono text-xs font-semibold text-primary-fg hover:opacity-90">
              <Megaphone className="size-3.5" strokeWidth={2.4} /> Publish
            </button>
          </>
        }
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Editor */}
        <aside className="flex w-[380px] shrink-0 flex-col gap-3.5 overflow-y-auto border-r border-border bg-bg p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-semibold">Editor</h2>
            <div className="inline-flex items-center gap-0.5 rounded-full bg-secondary p-0.5">
              {["Sections", "Theme", "Settings"].map((t, i) => (
                <button
                  key={t}
                  className={[
                    "rounded-full px-2.5 py-1 font-mono text-[11px]",
                    i === 0
                      ? "bg-bg shadow text-fg font-semibold"
                      : "text-muted-fg hover:text-fg",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5 flex flex-col gap-2.5">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
              Page
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[11px] text-muted-fg">Title</label>
              <div className="flex items-center rounded-lg border border-input bg-bg px-3 py-2">
                <input
                  defaultValue="Aspendora system status"
                  className="flex-1 bg-transparent font-mono text-[12px] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[11px] text-muted-fg">Slug · public URL</label>
              <div className="flex items-center gap-1.5 rounded-lg border border-input bg-bg px-3 py-2">
                <input
                  defaultValue="status.aspendora.com"
                  className="flex-1 bg-transparent font-mono text-[12px] focus:outline-none"
                />
                <CheckCircle2 className="size-3.5 text-success-fg" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
                Sections
              </div>
              <div className="font-mono text-[10px] text-muted-fg">drag to reorder</div>
            </div>
            {sections.map((s) => (
              <SectionRow key={s.id} section={s} />
            ))}
            <button className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 font-mono text-xs font-medium text-muted-fg hover:text-fg hover:border-muted-fg transition-colors">
              <Plus className="size-3.5" />
              Add section
            </button>
          </div>
        </aside>

        {/* Preview */}
        <div className="flex flex-1 min-w-0 flex-col gap-0 overflow-hidden bg-muted px-7 py-5">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2.5">
              <Eye className="size-3.5 text-muted-fg" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
                Preview · public view
              </span>
            </div>
            <div className="inline-flex items-center gap-0.5 rounded-full bg-secondary p-0.5">
              <button className="inline-flex items-center justify-center rounded-full bg-bg px-2.5 py-1.5 shadow">
                <Laptop className="size-3.5 text-fg" />
              </button>
              <button className="inline-flex items-center justify-center rounded-full px-2.5 py-1.5">
                <Smartphone className="size-3.5 text-muted-fg" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <PreviewWindow>
              <StatusPagePreview />
            </PreviewWindow>
          </div>
        </div>
      </div>
    </>
  );
}
