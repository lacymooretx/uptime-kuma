// Small UI primitives kept colocated for ergonomics.
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md";

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const sizeCls =
    size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-3.5 py-2 text-[12px]";
  const variantCls = {
    primary: "bg-primary text-primary-fg hover:opacity-90",
    secondary: "bg-secondary text-secondary-fg hover:bg-secondary/80",
    ghost: "text-fg hover:bg-secondary/60",
    destructive: "bg-destructive text-white hover:opacity-90",
    outline: "border border-border bg-transparent text-fg hover:bg-secondary/40",
  }[variant];
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-mono font-medium transition-colors",
        sizeCls,
        variantCls,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex size-8 items-center justify-center rounded-full bg-secondary text-fg hover:bg-secondary/80 transition-colors",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "primary";

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const cls = {
    neutral: "bg-secondary text-secondary-fg",
    success: "bg-success-bg text-success-fg",
    warning: "bg-warning-bg text-warning-fg",
    error: "bg-error-bg text-error-fg",
    info: "bg-info-bg text-info-fg",
    primary: "bg-primary text-primary-fg",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] ${cls}`}
    >
      {children}
    </span>
  );
}

export function Card({
  className = "",
  children,
  tone = "default",
}: {
  className?: string;
  children: ReactNode;
  tone?: "default" | "destructive" | "warning";
}) {
  const border =
    tone === "destructive"
      ? "border-destructive"
      : tone === "warning"
        ? "border-warning-fg"
        : "border-border";
  return (
    <div
      className={`rounded-2xl border ${border} bg-card ${className}`}
    >
      {children}
    </div>
  );
}

export function StatLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-fg">
      {children}
    </div>
  );
}

export function Avatar({
  initials,
  tone = "primary",
  size = 32,
}: {
  initials: string;
  tone?: "primary" | "info" | "secondary";
  size?: number;
}) {
  const cls = {
    primary: "bg-primary text-primary-fg",
    info: "bg-info-bg text-info-fg",
    secondary: "bg-secondary text-secondary-fg",
  }[tone];
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold ${cls}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}
