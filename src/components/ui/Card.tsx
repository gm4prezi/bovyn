import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  hover?: boolean;
  tone?: "surface" | "raised" | "glass" | "amber";
}

const TONES = {
  surface: "bg-surface border border-white/[0.07] shadow-card",
  raised: "bg-surface-raised border border-white/[0.09]",
  glass: "glass",
  amber: "glass-amber",
};

export function Card({
  children,
  className,
  padded = true,
  hover = false,
  tone = "surface",
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        TONES[tone],
        padded && "p-5",
        hover && "transition-all duration-300 hover:shadow-card-hover hover:border-amber/20 hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}
