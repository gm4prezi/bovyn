import { Clock, Info, Calculator, ArrowRightLeft, Shield } from "lucide-react";
import type { Signal, Tier } from "../../types";
import { cn } from "../../lib/cn";
import { GradeBadge, DirectionBadge, StatusBadge, Badge } from "../ui/Badge";
import { InlineLock } from "../ui/LockOverlay";
import { signalDelayFor } from "../../lib/tierGates";
import { WhyCard } from "./WhyCard";
import { useApp } from "../../context/AppContext";
import { INSTRUMENT_MAP } from "../../data/instruments";

interface SignalCardProps {
  signal: Signal;
  tier: Tier;
}

function formatPrice(v: number, instrument: string): string {
  if (instrument === "CL") return v.toFixed(2);
  if (instrument === "SI") return v.toFixed(3);
  if (instrument === "GC") return v.toFixed(1);
  if (instrument === "YM") return v.toFixed(0);
  return v.toFixed(2);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SignalCard({ signal, tier }: SignalCardProps) {
  const { accountSize, riskPct } = useApp();
  const delay = signalDelayFor(tier);
  const isTrial = tier === "trial";
  const isIntel = tier === "intel";
  const isResolved = ["TP1 Hit", "TP2 Hit", "TP3 Hit", "Stopped"].includes(signal.status);
  // Stopped = always a loss regardless of pnl value (may be 0 before settlement)
  const pnlPositive = signal.status !== "Stopped" && signal.pnl > 0;

  // Personalized sizing
  const inst = INSTRUMENT_MAP[signal.instrument];
  const riskDollars = (accountSize * riskPct) / 100;
  const stopDistance = Math.abs(signal.entry - signal.stop);
  const stopCost = inst ? (stopDistance / inst.tickSize) * inst.tickValue : 0;
  const yourContracts = stopCost > 0 ? Math.floor(riskDollars / stopCost) : 0;
  const yourMaxLoss = yourContracts * stopCost;

  // TP1 exit plan: sell 80% at TP1, hold 20% runner at breakeven
  const runner = yourContracts >= 2 ? Math.max(1, Math.floor(yourContracts * 0.2)) : 0;
  const sellAtTp1 = yourContracts - runner;
  const tp1Distance = inst ? Math.abs(signal.tp1 - signal.entry) : 0;
  const tp1ProfitPerCt = inst ? (tp1Distance / inst.tickSize) * inst.tickValue : 0;
  const tp1TotalProfit = sellAtTp1 * tp1ProfitPerCt;

  // Card styling based on state
  const isWin = isResolved && pnlPositive;
  const isLoss = isResolved && !pnlPositive;
  const isPending = signal.status === "Pending";
  const isRunning = signal.status === "Running";

  return (
    <div className={cn(
      "relative rounded-2xl bg-surface shadow-card overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover border",
      isWin && "border-bull/25 hover:border-bull/40",
      isLoss && "border-bear/25 hover:border-bear/40",
      isRunning && "border-amber/25 hover:border-amber/40",
      isPending && "border-white/[0.10] hover:border-amber/20",
      !isResolved && !isRunning && !isPending && "border-white/[0.07] hover:border-amber/20"
    )}>
      {/* Top accent bar — green/red for resolved, amber for active, grade for pending */}
      <div
        className={cn(
          "absolute left-0 right-0 top-0",
          isWin && "h-[3px] bg-bull shadow-[0_0_8px_rgba(34,197,94,0.4)]",
          isLoss && "h-[3px] bg-bear shadow-[0_0_8px_rgba(239,68,68,0.4)]",
          isRunning && "h-[3px] bg-amber shadow-amber-glow-sm",
          !isResolved && !isRunning && signal.grade === "S++" && "h-[2px] bg-gradient-amber shadow-amber-glow-sm",
          !isResolved && !isRunning && signal.grade === "A+" && "h-[2px] bg-amber/60",
          !isResolved && !isRunning && signal.grade === "A" && "h-[2px] bg-white/10"
        )}
      />
      {/* Subtle background tint for resolved */}
      {isWin && <div className="absolute inset-0 bg-bull/[0.02] pointer-events-none" />}
      {isLoss && <div className="absolute inset-0 bg-bear/[0.02] pointer-events-none" />}
      {isRunning && <div className="absolute inset-0 bg-amber/[0.02] pointer-events-none" />}

      <div className="p-4">
        {/* Header: instrument + badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-lg text-cream tracking-tight">
                {signal.instrument}
              </span>
              <DirectionBadge direction={signal.direction} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <GradeBadge grade={signal.grade} />
          </div>
        </div>

        {/* Price grid */}
        {isTrial ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-3 text-center">
            <div className="text-[10px] font-mono font-bold tracking-[0.14em] text-fog uppercase mb-1">
              48-hour delay
            </div>
            <div className="text-sm text-cream/80 font-light">
              Historical · grade + direction only
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "grid grid-cols-5 gap-2 mb-3 rounded-xl bg-white/[0.02] p-3 border border-white/[0.06]",
              isIntel && "relative"
            )}
          >
            <PriceCell label="Entry" value={formatPrice(signal.entry, signal.instrument)} blur={isIntel} />
            <PriceCell label="Stop" value={formatPrice(signal.stop, signal.instrument)} blur={isIntel} tone="bear" />
            <PriceCell label="TP1" value={formatPrice(signal.tp1, signal.instrument)} blur={isIntel} tone="bull" />
            <PriceCell label="TP2" value={formatPrice(signal.tp2, signal.instrument)} blur={isIntel} tone="bull" />
            <PriceCell label="TP3" value={formatPrice(signal.tp3, signal.instrument)} blur={isIntel} tone="bull" />
            {isIntel && (
              <div className="absolute inset-0 flex items-center justify-center">
                <InlineLock label="Operator Unlock" />
              </div>
            )}
          </div>
        )}

        {/* YOUR PLAN — TP1 exit strategy (operator+) */}
        {!isTrial && !isIntel && yourContracts > 0 && (
          <div className="mb-3 rounded-xl bg-amber/[0.04] border border-amber/15 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-amber/10">
              <Calculator className="h-3.5 w-3.5 text-amber flex-shrink-0" />
              <span className="text-[10px] font-mono font-bold text-amber uppercase tracking-wider flex-1">Your Plan</span>
              <span className="font-mono font-bold text-sm text-cream tabular-nums">{yourContracts} ct</span>
              <span className="text-[10px] font-mono text-fog">Risk ${yourMaxLoss.toFixed(0)}</span>
            </div>
            {/* TP1 exit breakdown */}
            <div className="px-3 py-2 space-y-1.5">
              {/* Step 1: Enter */}
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber/20 flex items-center justify-center text-[8px] font-mono font-bold text-amber flex-shrink-0">1</span>
                <span className="text-[11px] font-mono text-cream">
                  Enter <span className="font-bold text-amber">{yourContracts}</span> contract{yourContracts !== 1 ? "s" : ""}
                </span>
              </div>
              {/* Step 2: TP1 sell */}
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-bull/20 flex items-center justify-center text-[8px] font-mono font-bold text-bull flex-shrink-0">2</span>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-[11px] font-mono text-cream">
                    TP1 <ArrowRightLeft className="inline h-3 w-3 text-fog mx-0.5" /> Sell <span className="font-bold text-bull">{sellAtTp1}</span> <span className="text-fog">(80%)</span>
                  </span>
                  <span className="text-[10px] font-mono text-bull ml-auto flex-shrink-0">
                    +${tp1TotalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              {/* Step 3: Breakeven */}
              {runner > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-[8px] font-mono font-bold text-sky-400 flex-shrink-0">3</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <Shield className="h-3 w-3 text-sky-400 flex-shrink-0" />
                    <span className="text-[11px] font-mono text-cream">
                      Hold <span className="font-bold text-sky-400">{runner}</span> runner · stop → <span className="text-sky-400">breakeven</span>
                    </span>
                    <span className="text-[10px] font-mono text-fog ml-auto flex-shrink-0">$0 risk</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-sky-500/20 flex items-center justify-center text-[8px] font-mono font-bold text-sky-400 flex-shrink-0">3</span>
                  <span className="text-[11px] font-mono text-fog">
                    Full exit at TP1 <span className="text-fog/50">(1 ct = no runner)</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consensus + engines breakdown */}
        {!isTrial && (signal.consensusScore != null || signal.enginesFired) && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {signal.consensusScore != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold tracking-wide border",
                  signal.consensusLabel === "ELITE"
                    ? "bg-amber/10 border-amber/30 text-amber"
                    : signal.consensusLabel === "CONFIRMED"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/[0.04] border-white/10 text-fog"
                )}
              >
                {signal.consensusLabel ?? "SCORE"} {signal.consensusScore.toFixed(1)}
              </span>
            )}
            {signal.enginesFired && (
              <span className="text-[10px] font-mono text-fog/70">
                {signal.enginesFired.split(",").length} engines: {signal.enginesFired}
              </span>
            )}
          </div>
        )}

        {/* Signal tags + confluence */}
        {!isTrial && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(signal.signalTags ?? signal.confluence).slice(0, 5).map((c) => (
              <Badge key={c} variant="outline" size="xs">
                {c}
              </Badge>
            ))}
            {(signal.signalTags ?? signal.confluence).length > 5 && (
              <Badge variant="outline" size="xs">
                +{(signal.signalTags ?? signal.confluence).length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-fog">
            <StatusBadge status={signal.status} />
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" /> {relativeTime(signal.timestamp)}
            </span>
            <span className="hidden sm:inline font-mono text-[10px]">· {signal.session}</span>
          </div>
          {!isTrial && signal.status !== "Pending" && (
            <div className="flex items-center gap-1.5">
              {isResolved && (
                <span className="text-[8px] font-mono text-fog/40 uppercase tracking-wider">blended</span>
              )}
              <div
                className={cn(
                  "font-mono font-bold text-sm tabular-nums",
                  pnlPositive ? "text-bull" : "text-bear"
                )}
              >
                {pnlPositive ? "+" : ""}${Math.abs(signal.pnl).toLocaleString()}
              </div>
            </div>
          )}
          {!isTrial && signal.status === "Pending" && (
            <span className="text-[9px] font-mono text-fog/40">3h window</span>
          )}
        </div>

        {/* Grade reasoning — operator+ */}
        {tier !== "trial" && tier !== "intel" && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-amber mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-fog leading-relaxed font-light">
                {signal.gradeReasoning}
              </p>
            </div>
          </div>
        )}

        {/* Bovyn AI Analysis — on every card, operator+ */}
        {tier !== "trial" && tier !== "intel" && <WhyCard signal={signal} />}
      </div>

      {!isTrial && !delay.realtime && (
        <div className="absolute top-3 right-3">
          <span className="text-[9px] font-mono font-bold text-amber bg-amber/[0.1] border border-amber/25 px-1.5 py-0.5 rounded tracking-[0.1em] uppercase">
            {delay.label}
          </span>
        </div>
      )}
    </div>
  );
}

function PriceCell({
  label,
  value,
  blur,
  tone,
}: {
  label: string;
  value: string;
  blur?: boolean;
  tone?: "bull" | "bear";
}) {
  return (
    <div className="text-center">
      <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog uppercase mb-0.5">
        {label}
      </div>
      <div
        className={cn(
          "font-mono font-semibold text-[13px] tabular-nums",
          tone === "bull" && "text-bull",
          tone === "bear" && "text-bear",
          !tone && "text-cream",
          blur && "blur-lock"
        )}
      >
        {value}
      </div>
    </div>
  );
}
