import { useMarketState } from "../../hooks/useMarketState";
import { LiveDot } from "../ui/LiveDot";
import { cn } from "../../lib/cn";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

export function MarketConditionBanner() {
  const { data, loading } = useMarketState();

  if (loading || !data) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-white/[0.08] shadow-card p-5">
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-4 w-4 text-amber animate-spin" />
          <span className="text-xs text-fog">Loading market state...</span>
        </div>
      </div>
    );
  }

  const session = data.session ?? "";
  const bias = (data.daily_bias ?? "neutral").toUpperCase();
  const longs = data.direction_counts?.LONG ?? 0;
  const shorts = data.direction_counts?.SHORT ?? 0;

  // HTF structure is the truth — daily bias drives the headline
  const htfBearish = bias === "BEAR" || bias === "SHORT";
  const htfBullish = bias === "BULL" || bias === "LONG";
  const dominantSignalDir = longs > shorts ? "LONG" : shorts > longs ? "SHORT" : "NEUTRAL";
  const signalsAgainstHTF =
    (htfBearish && dominantSignalDir === "LONG") ||
    (htfBullish && dominantSignalDir === "SHORT");

  const htfLabel = htfBearish ? "BEARISH" : htfBullish ? "BULLISH" : "NEUTRAL";
  const contextLabel = signalsAgainstHTF
    ? "CT Reversion"
    : htfBearish || htfBullish
      ? "With Trend"
      : "Developing";
  const headline = `${htfLabel} — ${contextLabel}`;

  // Context narrative
  const narrative = signalsAgainstHTF && htfBearish
    ? "HTF bearish — signals identify counter-trend reversion. Tighter stops."
    : signalsAgainstHTF && htfBullish
      ? "HTF bullish — signals identify pullback shorts. Counter-trend, manage risk."
      : htfBearish && dominantSignalDir === "SHORT"
        ? "HTF bearish, signals aligned short. With-trend — higher probability."
        : htfBullish && dominantSignalDir === "LONG"
          ? "HTF bullish, signals aligned long. With-trend — higher probability."
          : "Mixed conditions. Be selective.";

  // Build instrument reads from live data
  const instruments = data.instruments ?? {};
  const reads = Object.entries(instruments).map(([symbol, info]) => {
    const instBias = (info.bias ?? info.direction ?? "").toUpperCase();
    const instHTFBear = instBias === "BEAR" || instBias === "SHORT";
    const isCT =
      (instHTFBear && info.direction === "LONG") ||
      (!instHTFBear && instBias !== "NEUTRAL" && info.direction === "SHORT");
    return {
      symbol,
      direction: info.direction,
      grade: info.grade,
      consensus: info.consensus_score,
      label: info.consensus_label,
      fresh: info.fresh,
      isCT,
      bias: info.direction === "LONG" ? "bullish" as const
          : info.direction === "SHORT" ? "bearish" as const
          : "neutral" as const,
    };
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface border border-white/[0.08] shadow-card aurora-bg">
      <div className="absolute inset-0 opacity-40 grid-bg" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber/[0.12] blur-3xl animate-aurora-drift" />
      <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-amber/[0.06] blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px glow-line" />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LiveDot tone="amber" />
            <span className="text-[10px] font-mono font-bold text-fog tracking-[0.14em] uppercase">
              {session} · {data.signals_today} signals today
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-fog tracking-[0.14em] uppercase">
            Market Regime
          </span>
        </div>

        <div className="mb-5">
          <h2 className="font-display text-3xl font-medium tracking-tight leading-[1.05] text-cream">
            {headline.split(" — ")[0]}
            {headline.includes(" — ") && (
              <span className="text-gradient-amber"> — {headline.split(" — ")[1]}</span>
            )}
          </h2>
          <p className="text-xs text-fog mt-1.5 font-light">
            HTF bias: <span className={htfBearish ? "text-bear" : htfBullish ? "text-bull" : "text-fog"}>{bias}</span>
            {" · "}{longs}L / {shorts}S
            {signalsAgainstHTF && (
              <span className="text-amber ml-1.5 font-mono text-[10px]">[CT]</span>
            )}
          </p>
          <p className="text-[10px] text-fog/70 mt-1 font-light italic">{narrative}</p>
        </div>

        {reads.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5 pt-3 border-t border-white/[0.08]">
            {reads.map((r) => (
              <div key={r.symbol} className="flex items-start gap-2 min-w-0">
                <BiasIcon bias={r.bias} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-cream tracking-[0.1em]">
                      {r.symbol}
                    </span>
                    {r.fresh && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <div className="text-[11px] text-fog leading-tight truncate font-light">
                    {r.direction} {r.grade}
                    {r.isCT && <span className="text-amber ml-1 text-[9px] font-mono">CT</span>}
                  </div>
                  <div className="text-[10px] text-fog/60 leading-tight truncate">
                    {r.label} ({r.consensus != null ? r.consensus.toFixed(1) : "—"})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BiasIcon({ bias }: { bias: "bullish" | "bearish" | "neutral" }) {
  const base = "h-3 w-3 mt-0.5 flex-shrink-0";
  if (bias === "bullish") return <TrendingUp className={cn(base, "text-bull")} />;
  if (bias === "bearish") return <TrendingDown className={cn(base, "text-bear")} />;
  return <Minus className={cn(base, "text-fog")} />;
}
