import { cn } from "../../lib/cn";
import { INSTRUMENTS } from "../../data/instruments";
import type { InstrumentSymbol } from "../../types";

interface InstrumentTabsProps {
  active: InstrumentSymbol | "ALL";
  onChange: (s: InstrumentSymbol | "ALL") => void;
  counts?: Partial<Record<InstrumentSymbol | "ALL", number>>;
}

export function InstrumentTabs({ active, onChange, counts }: InstrumentTabsProps) {
  const items: Array<{ id: InstrumentSymbol | "ALL"; label: string }> = [
    { id: "ALL", label: "All" },
    ...INSTRUMENTS.map((i) => ({ id: i.symbol, label: i.symbol })),
  ];

  return (
    <div className="no-scrollbar -mx-4 px-4 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono font-bold text-[11px] tracking-[0.1em] transition-all duration-200 min-h-[44px]",
              "ring-focus",
              isActive
                ? "bg-amber text-bg shadow-amber-glow-sm"
                : "bg-white/[0.04] border border-white/[0.08] text-cream/80 hover:text-cream hover:border-amber/30"
            )}
          >
            <span>{item.label.toUpperCase()}</span>
            {counts?.[item.id] !== undefined && (
              <span
                className={cn(
                  "text-[9px] font-sans font-semibold px-1.5 py-0.5 rounded",
                  isActive ? "bg-bg/20 text-bg" : "bg-white/[0.06] text-fog"
                )}
              >
                {counts[item.id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
