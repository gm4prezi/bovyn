import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "amber" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS = {
  // Primary = amber (brand accent)
  primary:
    "bg-amber text-bg hover:bg-amber-300 active:bg-amber-500 shadow-amber-glow-sm font-semibold",
  // Secondary = raised surface with hairline
  secondary:
    "bg-surface-raised text-cream border border-white/[0.08] hover:border-amber/40 hover:bg-surface-high active:bg-surface",
  // Ghost = transparent
  ghost: "bg-transparent text-cream/80 hover:text-amber hover:bg-white/[0.03]",
  // Amber gradient for CTAs
  amber:
    "bg-gradient-amber text-bg hover:brightness-[1.08] shadow-amber-glow font-semibold",
  // Outline on dark
  outline: "bg-transparent border border-white/[0.1] text-cream hover:bg-white/[0.04] hover:border-amber/30",
  // Danger
  danger:
    "bg-bear/10 text-bear border border-bear/30 hover:bg-bear/15",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-5 py-3 rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 ring-focus",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {iconLeft && <span className="flex-shrink-0">{iconLeft}</span>}
      {children}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}
