import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { Grade, Direction, SignalStatus } from "../../types";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "neutral"
    | "amber"
    | "bull"
    | "bear"
    | "outline";
  size?: "xs" | "sm" | "md";
  className?: string;
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-white/[0.04] text-cream/70 border border-white/[0.08]",
  amber: "bg-amber/[0.08] text-amber border border-amber/25",
  bull: "bg-bull/10 text-bull border border-bull/25",
  bear: "bg-bear/10 text-bear border border-bear/25",
  outline: "bg-transparent text-fog border border-white/[0.08]",
};

const SIZES = {
  xs: "text-[10px] px-1.5 py-0.5 rounded-md tracking-[0.08em]",
  sm: "text-[11px] px-2 py-0.5 rounded-md tracking-[0.08em]",
  md: "text-xs px-2.5 py-1 rounded-lg tracking-[0.06em]",
};

export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-bold uppercase",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Grade-specific styled badge
export function GradeBadge({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" }) {
  const sizeCls =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 rounded-md"
      : "text-xs px-2.5 py-1 rounded-lg";

  if (grade === "S++") {
    return (
      <span
        className={cn(
          "relative inline-flex items-center font-bold uppercase tracking-[0.08em] font-mono",
          "bg-gradient-amber text-bg border border-amber-300",
          "shadow-amber-glow",
          sizeCls
        )}
      >
        <span className="relative">S++</span>
      </span>
    );
  }
  if (grade === "A+") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold uppercase tracking-[0.08em] font-mono",
          "bg-amber/[0.12] text-amber border border-amber/40",
          "shadow-amber-glow-sm",
          sizeCls
        )}
      >
        A+
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-[0.08em] font-mono",
        "bg-white/[0.05] text-cream/80 border border-white/[0.1]",
        sizeCls
      )}
    >
      A
    </span>
  );
}

export function DirectionBadge({ direction }: { direction: Direction }) {
  const bull = direction === "LONG";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold uppercase tracking-[0.1em] font-mono text-[10px] px-2 py-0.5 rounded-md border",
        bull
          ? "text-bull bg-bull/[0.08] border-bull/30"
          : "text-bear bg-bear/[0.08] border-bear/30"
      )}
    >
      <span>{bull ? "▲" : "▼"}</span>
      {direction}
    </span>
  );
}

const STATUS_STYLES: Record<SignalStatus, { label: string; cls: string }> = {
  Pending: { label: "PENDING", cls: "bg-white/[0.04] text-fog border-white/[0.08]" },
  Running: {
    label: "● RUNNING",
    cls: "bg-amber/[0.1] text-amber border-amber/30 animate-pulse",
  },
  "TP1 Hit": {
    label: "TP1 HIT",
    cls: "bg-bull/[0.1] text-bull border-bull/30",
  },
  "TP2 Hit": {
    label: "TP2 HIT",
    cls: "bg-bull/[0.1] text-bull border-bull/30",
  },
  "TP3 Hit": {
    label: "TP3 HIT",
    cls: "bg-bull/[0.12] text-bull border-bull/40",
  },
  Stopped: { label: "STOPPED", cls: "bg-bear/[0.1] text-bear border-bear/30" },
  Cancelled: { label: "CANCELLED", cls: "bg-white/[0.04] text-fog border-white/[0.08]" },
};

export function StatusBadge({ status }: { status: SignalStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-[0.1em] font-mono text-[10px] px-2 py-0.5 rounded-md border",
        s.cls
      )}
    >
      {s.label}
    </span>
  );
}
