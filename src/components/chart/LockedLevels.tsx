import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "../../lib/bovynApi";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "../../lib/cn";

const API_URL = import.meta.env.VITE_BOVYN_API_URL ?? "https://app.bovyn.io/api";

interface Level {
  price: number;
  label: string;
  color: string;
  desc: string;
  group?: string;
}

interface SymbolLevels {
  [key: string]: Level;
}

interface LevelsData {
  ok: boolean;
  levels: Record<string, SymbolLevels>;
}

/* ── Level display order within each group ── */
const GROUP_ORDER: { id: string; label: string; keys: readonly string[] }[] = [
  { id: "daily",     label: "Daily",          keys: ["PDH", "PDL"] },
  { id: "session",   label: "Session",        keys: ["SH", "SL"] },
  { id: "liquidity", label: "Liquidity",      keys: ["BSL", "SSL"] },
  { id: "profile",   label: "Volume Profile", keys: ["UEP", "VAH", "MGP", "GP", "NECT", "POC", "VAL", "LEP"] },
];

const LABEL_META: Record<string, { color: string; label: string; desc: string; scenario: string; bias: "bull" | "bear" | "neutral" }> = {
  /* Daily */
  PDH:  { color: "#22C55E", label: "PDH",  desc: "Prev Day High",    scenario: "Breakout above = trend continuation. Rejection = short fade.", bias: "neutral" },
  PDL:  { color: "#EF4444", label: "PDL",  desc: "Prev Day Low",     scenario: "Hold = long opportunity. Breakdown below = bearish continuation.", bias: "neutral" },
  /* Session */
  SH:   { color: "#38BDF8", label: "SH",   desc: "Session High",     scenario: "Watch for double top / fade, or momentum break & hold above.", bias: "neutral" },
  SL:   { color: "#F97316", label: "SL",   desc: "Session Low",      scenario: "Bounce zone for longs. Break & hold below = session continuation short.", bias: "neutral" },
  /* Liquidity */
  BSL:  { color: "#00E5FF", label: "BSL",  desc: "Buy Side Liq",     scenario: "Smart money sweeps stops above → expect sharp reversal south after.", bias: "bear" },
  SSL:  { color: "#FF6B6B", label: "SSL",  desc: "Sell Side Liq",    scenario: "Smart money sweeps stops below → expect sharp reversal north after.", bias: "bull" },
  /* Volume Profile */
  UEP:  { color: "#00E5FF", label: "UEP",  desc: "Upper Extension",  scenario: "Extreme range edge. If reached, strong fade / mean reversion expected.", bias: "bear" },
  VAH:  { color: "#C4872A", label: "VAH",  desc: "Value Area High",  scenario: "90% of volume below. Sellers defend here — watch for rejection.", bias: "bear" },
  MGP:  { color: "#E8A838", label: "MGP",  desc: "Major Gap Point",  scenario: "Unfilled price gap acts as magnet. Price often gravitates to fill.", bias: "neutral" },
  GP:   { color: "#D4922F", label: "GP",   desc: "Gap Point",        scenario: "Minor gap fill target. Look for price to tag it intraday.", bias: "neutral" },
  POC:  { color: "#E8A838", label: "POC",  desc: "Point of Control", scenario: "Highest volume node = fair value. Price magnetically returns here.", bias: "neutral" },
  VAL:  { color: "#A87024", label: "VAL",  desc: "Value Area Low",   scenario: "90% of volume above. Buyers defend here — watch for bounce.", bias: "bull" },
  NECT: { color: "#A855F7", label: "NECT", desc: "Next Target",      scenario: "Elastic target if price breaks VAH/VAL. Momentum continuation.", bias: "neutral" },
  LEP:  { color: "#FF6B6B", label: "LEP",  desc: "Lower Extension",  scenario: "Extreme range edge. If reached, strong bounce / mean reversion expected.", bias: "bull" },
};

const SYMBOLS = ["NQ", "ES", "GC", "CL", "SI", "RTY", "YM"] as const;
type Sym = (typeof SYMBOLS)[number];

function fmt(price: number) {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function LockedLevels({ activeSym }: { activeSym: Sym }) {
  const [data, setData] = useState<LevelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchLevels = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/chart/levels?symbol=${activeSym}`, { headers });
      const json: LevelsData = await res.json();
      setData(json);
      setLastFetch(Date.now());
    } catch {
      /* retry on manual refresh */
    } finally {
      setLoading(false);
    }
  }, [activeSym]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const levels = data?.levels?.[activeSym];

  /* Build grouped rows from API data */
  const groups = GROUP_ORDER.map((g) => {
    const rows = g.keys
      .filter((k) => levels?.[k])
      .map((k) => {
        const api = levels![k];
        const meta = LABEL_META[k] ?? { color: api.color, label: api.label, desc: api.desc };
        return {
          key: k,
          price: api.price,
          color: api.color || meta.color,
          label: meta.label,
          desc: api.desc || meta.desc,       // API desc can override (e.g. "NY AM High")
        };
      })
      .sort((a, b) => b.price - a.price);
    return { ...g, rows };
  }).filter((g) => g.rows.length > 0);

  const totalLevels = groups.reduce((n, g) => n + g.rows.length, 0);

  const timestamp =
    lastFetch > 0
      ? new Date(lastFetch).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Panel header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[0.12em] text-fog uppercase">
            Locked Levels
          </span>
          <span className="text-[10px] font-mono text-amber font-semibold">{activeSym}</span>
        </div>
        <button
          onClick={fetchLevels}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] text-fog/50 hover:text-fog transition-colors"
        >
          <RefreshCw className={cn("h-2.5 w-2.5", loading && "animate-spin")} />
          {timestamp ?? "\u2014"}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && !data && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-4 w-4 animate-spin text-amber/60" />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && totalLevels === 0 && (
        <p className="text-[11px] text-fog/40 text-center py-8">No levels available</p>
      )}

      {/* ── Grouped level rows ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {groups.map((g) => (
          <div key={g.id}>
            {/* Group header */}
            <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-[0.14em] text-fog/40 uppercase">
                {g.label}
              </span>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>

            {/* Level rows */}
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {g.rows.map(({ key, price, color, label, desc }) => {
                const meta = LABEL_META[key];
                const scenario = meta?.scenario;
                const bias = meta?.bias ?? "neutral";
                const biasColor =
                  bias === "bull" ? "#22c55e" :
                  bias === "bear" ? "#ef4444" :
                  "rgba(255,255,255,0.3)";
                const biasLabel =
                  bias === "bull" ? "↑ BULLISH" :
                  bias === "bear" ? "↓ BEARISH" :
                  "↔ NEUTRAL";
                return (
                  <div
                    key={key}
                    className="px-4 py-2.5 relative overflow-hidden"
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ background: color }}
                    />

                    {/* Top row: badge + desc + price */}
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[10px] font-bold font-mono tracking-wider w-10 text-center py-0.5 rounded flex-shrink-0"
                        style={{ color, background: `${color}18` }}
                      >
                        {label}
                      </span>
                      <span className="text-[10px] text-fog/60 flex-1">{desc}</span>
                      <span
                        className="text-[12px] font-mono font-semibold tabular-nums flex-shrink-0"
                        style={{ color }}
                      >
                        {fmt(price)}
                      </span>
                    </div>

                    {/* Scenario line */}
                    {scenario && (
                      <div className="mt-1.5 ml-[52px] flex items-start gap-1.5">
                        <span
                          className="text-[8px] font-mono font-bold tracking-[0.1em] flex-shrink-0 mt-px"
                          style={{ color: biasColor }}
                        >
                          {biasLabel}
                        </span>
                        <span className="text-[9px] text-fog/40 leading-tight">
                          {scenario}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      {totalLevels > 0 && (
        <div className="px-4 py-2.5 mt-auto border-t border-white/[0.04]">
          <p className="text-[9px] text-fog/25 text-center leading-relaxed">
            Session-locked · Updates at open
          </p>
        </div>
      )}
    </div>
  );
}
