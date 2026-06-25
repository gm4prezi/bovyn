import { cn } from "../../lib/cn";

export function LiveDot({
  label = "LIVE",
  tone = "amber",
  className,
}: {
  label?: string;
  tone?: "amber" | "bull" | "bear";
  className?: string;
}) {
  const color =
    tone === "bull" ? "bg-bull" : tone === "bear" ? "bg-bear" : "bg-amber";

  const text =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-amber";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold text-[10px] tracking-[0.14em] uppercase",
        text,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
            color
          )}
        />
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", color)} />
      </span>
      {label}
    </span>
  );
}
