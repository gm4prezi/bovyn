import { Lock, ArrowRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

interface LockOverlayProps {
  requiredTier: string;
  title: string;
  description: string;
  onUpgrade?: () => void;
  className?: string;
  compact?: boolean;
}

export function LockOverlay({
  requiredTier,
  title,
  description,
  onUpgrade,
  className,
  compact,
}: LockOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center",
        "bg-bg/70 backdrop-blur-md rounded-2xl border border-white/[0.06]",
        className
      )}
    >
      <div
        className={cn(
          "max-w-sm mx-auto text-center",
          compact ? "px-4 py-5" : "px-6 py-8"
        )}
      >
        <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-amber/[0.1] border border-amber/30 flex items-center justify-center shadow-amber-glow-sm">
          <Lock className="h-5 w-5 text-amber" strokeWidth={2.25} />
        </div>
        <div className="text-[10px] font-mono font-bold tracking-[0.14em] text-amber uppercase mb-2">
          {requiredTier} Tier
        </div>
        <h3 className="font-display text-xl font-medium text-cream mb-1.5 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-fog mb-4 leading-relaxed font-light">{description}</p>
        {onUpgrade && (
          <Button
            variant="amber"
            size="sm"
            iconRight={<ArrowRight className="h-3.5 w-3.5" />}
            onClick={onUpgrade}
          >
            Upgrade to {requiredTier}
          </Button>
        )}
      </div>
    </div>
  );
}

export function InlineLock({
  label = "UPGRADE REQUIRED",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-[0.12em] text-amber bg-amber/[0.08] border border-amber/25 rounded-md px-2 py-1",
        className
      )}
    >
      <Lock className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </div>
  );
}
