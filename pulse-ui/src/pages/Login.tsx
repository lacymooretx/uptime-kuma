import { Radar } from "lucide-react";
import { loginUrl } from "../lib/auth";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <Radar className="size-6" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="font-mono text-lg font-semibold">Pulse</div>
            <div className="text-[12px] text-muted-fg">Uptime monitoring</div>
          </div>
        </div>

        <h1 className="font-mono text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-[13px] text-muted-fg">
          Use your aspendora workspace account to continue.
        </p>

        <a
          href={loginUrl("/v2/")}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-mono text-sm font-semibold text-primary-fg hover:opacity-90"
        >
          {/* Microsoft logo squares */}
          <svg className="size-4" viewBox="0 0 23 23" aria-hidden>
            <rect width="10" height="10" x="1" y="1" fill="#f25022" />
            <rect width="10" height="10" x="12" y="1" fill="#7fba00" />
            <rect width="10" height="10" x="1" y="12" fill="#00a4ef" />
            <rect width="10" height="10" x="12" y="12" fill="#ffb900" />
          </svg>
          Sign in with Microsoft
        </a>

        <div className="mt-6 text-center text-[11px] text-muted-fg">
          Authentication is handled by your Entra ID tenant.
        </div>
      </div>
    </div>
  );
}
