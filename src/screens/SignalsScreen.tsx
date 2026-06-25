import { useMemo, useState } from "react";
import { MarketConditionBanner } from "../components/signals/MarketConditionBanner";
import { InstrumentTabs } from "../components/signals/InstrumentTabs";
import { SignalCard } from "../components/signals/SignalCard";
import { SessionPill } from "../components/signals/SessionPill";
import { useApp } from "../context/AppContext";
import { useSignals } from "../hooks/useSignals";
import type { InstrumentSymbol } from "../types";
import { signalDelayFor } from "../lib/tierGates";
import { AlertCircle, Radar } from "lucide-react";

export function SignalsScreen() {
  const { tier } = useApp();
  const [active, setActive] = useState<InstrumentSymbol | "ALL">("ALL");
  const delay = signalDelayFor(tier);

  const {
    signals: liveSignals,
    live,
    configured,
    error,
    lastUpdated,
  } = useSignals({ limit: 50 });

  const feed = liveSignals;
  const sourceLabel = live && !error ? "LIVE" : error ? "ERROR" : "LOADING";

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: feed.length };
    for (const s of feed) {
      map[s.instrument] = (map[s.instrument] ?? 0) + 1;
    }
    return map;
  }, [feed]);

  const filtered = useMemo(() => {
    if (active === "ALL") return feed;
    return feed.filter((s) => s.instrument === active);
  }, [active, feed]);

  return (
    <div className="space-y-4 pb-4 md:space-y-8 md:pb-8">
      <MarketConditionBanner />

      {(tier === "intel" || tier === "trial") && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber/[0.06] border border-amber/25 p-3 md:p-4">
          <AlertCircle className="h-4 w-4 text-amber mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-amber md:text-sm">
              {delay.label}
            </div>
            <div className="text-[11px] text-amber/80 mt-0.5 font-light md:text-xs">
              {tier === "trial"
                ? "Trial shows historical reads only. Upgrade to Intel for live grades."
                : "Entries, stops, and targets are Operator+. Upgrade for zero-delay detail."}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/25 p-3 md:p-4">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-red-400 md:text-sm">
              Live feed unreachable
            </div>
            <div className="text-[11px] text-red-300/80 mt-0.5 font-light md:text-xs">
              {error.message}. Showing last known data.
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-end justify-between mb-3 md:mb-6 px-0 gap-3">
          <div className="min-w-0">
            <div className="label mb-1 md:mb-2 flex items-center gap-2">
              <span>Live Feed</span>
              <span
                className={
                  sourceLabel === "LIVE"
                    ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-emerald-400"
                    : "inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-widest text-fog"
                }
              >
                {sourceLabel === "LIVE" && (
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {sourceLabel}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-cream leading-none">
              Signals
            </h1>
            <p className="text-xs md:text-sm text-fog mt-1.5 md:mt-3 font-light">
              {filtered.length} signal{filtered.length === 1 ? "" : "s"} · {delay.label}
              {lastUpdated && sourceLabel === "LIVE" && (
                <>
                  {" "}
                  · updated{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </>
              )}
            </p>
          </div>
          <SessionPill />
        </div>
        <InstrumentTabs active={active} onChange={setActive} counts={counts} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState instrument={active === "ALL" ? undefined : active} />
          </div>
        ) : (
          filtered.map((signal) => (
            <SignalCard key={signal.id} signal={signal} tier={tier} />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ instrument }: { instrument?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface border border-white/[0.08] p-8 text-center">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber/[0.06] blur-3xl" />
      <div className="relative">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-amber/[0.08] border border-amber/25 items-center justify-center mb-3">
          <Radar className="h-5 w-5 text-amber" strokeWidth={2} />
        </div>
        <div className="font-display text-xl font-medium text-cream tracking-tight mb-1">
          No active signals
        </div>
        <p className="text-xs text-fog font-light max-w-[260px] mx-auto">
          {instrument
            ? `${instrument} is out of context. BOVYN waits for A grade or higher — no setups, no trades.`
            : "The engine is scanning 7 instruments. A+ and S++ setups appear here the moment they print."}
        </p>
      </div>
    </div>
  );
}
