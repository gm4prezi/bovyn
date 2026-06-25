import { useState } from "react";
import { MockCandleChart } from "../components/chart/MockCandleChart";
import { LockedLevels } from "../components/chart/LockedLevels";
import { cn } from "../lib/cn";
import { Droplets, BarChart2, Clock, MapPin, Square } from "lucide-react";

const SYMBOLS = ["NQ", "ES", "GC", "CL", "SI", "RTY", "YM"] as const;
type Sym = typeof SYMBOLS[number];

const INTERVALS = [
  { label: "1m",  value: "1"   },
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "1H",  value: "60"  },
  { label: "4H",  value: "240" },
  { label: "D",   value: "D"   },
] as const;

const OVERLAYS = [
  { id: "liquidity", label: "Liquidity", icon: Droplets  },
  { id: "pivots",    label: "Pivots",    icon: BarChart2 },
  { id: "sessions",  label: "Sessions",  icon: Clock     },
  { id: "signals",   label: "Signals",   icon: MapPin    },
  { id: "zones",     label: "Zones",     icon: Square    },
] as const;

export function ChartScreen() {
  const [activeSym, setActiveSym] = useState<Sym>("NQ");
  const [interval, setInterval] = useState("15");
  const [overlays, setOverlays] = useState<Set<string>>(
    new Set(["liquidity", "pivots", "sessions", "signals", "zones"])
  );

  const toggleOverlay = (id: string) =>
    setOverlays((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-cream">Chart</h1>
          <p className="text-[11px] text-fog mt-0.5">Live price · Locked pivots</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-mono font-semibold tracking-widest">LIVE</span>
        </div>
      </div>

      {/* ── Symbol tabs ── */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {SYMBOLS.map((sym) => (
          <button
            key={sym}
            onClick={() => setActiveSym(sym)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider font-mono transition-all",
              activeSym === sym
                ? "bg-amber text-bg shadow-amber-glow-sm"
                : "bg-white/[0.05] text-fog hover:text-cream hover:bg-white/[0.08]"
            )}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* ── Timeframe + Overlay toggles ── */}
      <div className="flex items-center justify-between">
        {/* Timeframes */}
        <div className="flex gap-0.5">
          {INTERVALS.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setInterval(tf.value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all",
                interval === tf.value
                  ? "bg-white/[0.10] text-cream"
                  : "text-fog/60 hover:text-fog"
              )}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Overlay toggles */}
        <div className="flex items-center gap-0.5">
          {OVERLAYS.map(({ id, label, icon: Icon }) => {
            const active = overlays.has(id);
            return (
              <button
                key={id}
                onClick={() => toggleOverlay(id)}
                title={label}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  active
                    ? "text-amber bg-amber/10 border border-amber/20"
                    : "text-white/20 hover:text-white/40 border border-transparent"
                )}
              >
                <Icon className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chart + Levels ── */}
      <div className="flex flex-col md:flex-row gap-3 items-start">

        {/* Mockup candlestick chart with real levels overlaid */}
        <div className="w-full md:flex-1 rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0c0e]" style={{ minHeight: "min(420px, 50dvh)" }}>
          <MockCandleChart symbol={activeSym} interval={interval} />
        </div>

        {/* Locked Pivots panel */}
        <div className="w-full md:w-64 flex-shrink-0 surface rounded-xl border border-white/[0.06] overflow-hidden" style={{ maxHeight: "min(600px, 40dvh)", overflowY: "auto" }}>
          <LockedLevels activeSym={activeSym} />
        </div>
      </div>
    </div>
  );
}
