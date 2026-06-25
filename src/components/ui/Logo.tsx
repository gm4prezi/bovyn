import { cn } from "../../lib/cn";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: "h-7 w-7", text: "text-sm tracking-[0.18em]" },
  md: { box: "h-9 w-9", text: "text-base tracking-[0.2em]" },
  lg: { box: "h-12 w-12", text: "text-xl tracking-[0.22em]" },
};

export function Logo({ size = "md", showWordmark = true, className }: LogoProps) {
  const s = SIZE_MAP[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn("shrink-0", s.box)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="20" fill="#040404" />
        {/* Geometric B — vertical spine */}
        <path
          d="M 22 16 L 22 84"
          stroke="#F8F6F2"
          strokeWidth="9"
          strokeLinecap="square"
        />
        {/* Top bowl */}
        <path
          d="M 22 16 L 50 16 Q 71 16 71 34 Q 71 50 50 50 L 22 50"
          stroke="#F8F6F2"
          strokeWidth="9"
          strokeLinecap="square"
          fill="none"
        />
        {/* Bottom bowl — wider */}
        <path
          d="M 22 50 L 54 50 Q 78 50 78 67 Q 78 84 54 84 L 22 84"
          stroke="#F8F6F2"
          strokeWidth="9"
          strokeLinecap="square"
          fill="none"
        />
        {/* Amber slash */}
        <line
          x1="6"
          y1="94"
          x2="94"
          y2="6"
          stroke="#F0A020"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Center signal dot */}
        <circle cx="50" cy="50" r="9" fill="#040404" />
        <circle cx="50" cy="50" r="5" fill="#F0A020" />
      </svg>
      {showWordmark && (
        <span
          className={cn(
            "font-mono font-bold uppercase text-cream leading-none",
            s.text
          )}
        >
          BOVYN
        </span>
      )}
    </div>
  );
}
