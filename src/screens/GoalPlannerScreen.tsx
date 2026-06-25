import { useState, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { INSTRUMENTS } from "../data/instruments";
import { cn } from "../lib/cn";
import {
  Target, Shield, Zap, TrendingUp, DollarSign, AlertTriangle,
} from "lucide-react";

/* ── TP1 hit rate — CONFIRMED consensus gate (score ≥ 6): 86% across 57 trades ── */
const TP1_WIN_RATES: Record<string, number> = {
  NQ: 86, ES: 86, GC: 86, SI: 86, CL: 86, RTY: 86, YM: 86,
};

/* ── Stop distances [conservative, moderate, aggressive] ── */
const STOPS: Record<string, [number, number, number]> = {
  NQ:  [20,   25,   35  ],
  ES:  [6,    8,    12  ],
  YM:  [60,   80,   120 ],
  RTY: [2,    3,    4   ],
  CL:  [0.35, 0.50, 0.70],
  GC:  [4,    5,    7   ],
  SI:  [0.12, 0.15, 0.20],
};

type Mode = "conservative" | "moderate" | "aggressive";

const MODE_CFG: Record<Mode, {
  label: string; icon: React.ElementType; riskPct: number;
  tp1R: number; tp2R: number; tp3R: number; stopIdx: 0 | 1 | 2;
  color: string; bg: string; border: string;
}> = {
  conservative: {
    label: "Conservative", icon: Shield,  riskPct: 0.75,
    tp1R: 1.5, tp2R: 2.5, tp3R: 4.0, stopIdx: 0,
    color: "text-bull",  bg: "bg-bull/[0.08]",  border: "border-bull/25",
  },
  moderate: {
    label: "Moderate",    icon: Target,  riskPct: 1.5,
    tp1R: 1.5, tp2R: 2.5, tp3R: 4.0, stopIdx: 1,
    color: "text-amber", bg: "bg-amber/[0.08]", border: "border-amber/25",
  },
  aggressive: {
    label: "Aggressive",  icon: Zap,     riskPct: 2.5,
    tp1R: 1.5, tp2R: 2.5, tp3R: 5.0, stopIdx: 2,
    color: "text-bear",  bg: "bg-bear/[0.07]",  border: "border-bear/25",
  },
};

export function GoalPlannerScreen() {
  const [weeklyGoal, setWeeklyGoal] = useState(5000);
  const [accountSize, setAccountSize] = useState(50000);
  const [mode, setMode] = useState<Mode>("moderate");

  const cfg = MODE_CFG[mode];

  const { instruments, tradesNeeded, tradesPerDay, avgEdge, avgWinRate, riskDollars } =
    useMemo(() => {
      const riskDollars = accountSize * cfg.riskPct / 100;

      const instruments = INSTRUMENTS.map((inst) => {
        const stopPts = STOPS[inst.symbol]?.[cfg.stopIdx] ?? 10;
        const stopCostPerCt = (stopPts / inst.tickSize) * inst.tickValue;
        const contracts = stopCostPerCt > 0 ? Math.floor(riskDollars / stopCostPerCt) : 0;
        const actualRisk = contracts * stopCostPerCt;
        const tp1 = actualRisk * cfg.tp1R;
        const tp2 = actualRisk * cfg.tp2R;
        const tp3 = actualRisk * cfg.tp3R;
        const wr = (TP1_WIN_RATES[inst.symbol] ?? 70) / 100;
        const edge = wr * tp1 - (1 - wr) * actualRisk;
        return { symbol: inst.symbol, contracts, actualRisk, tp1, tp2, tp3, winRate: TP1_WIN_RATES[inst.symbol] ?? 70, edge };
      });

      const viable = instruments.filter((i) => i.contracts > 0 && i.edge > 0);
      const avgEdge = viable.length ? viable.reduce((s, i) => s + i.edge, 0) / viable.length : 0;
      const avgWinRate = viable.length ? viable.reduce((s, i) => s + i.winRate, 0) / viable.length : 0;
      const tradesNeeded = avgEdge > 0 ? Math.ceil(weeklyGoal / avgEdge) : 0;
      const tradesPerDay = tradesNeeded > 0 ? Math.ceil(tradesNeeded / 5) : 0;

      return { instruments, tradesNeeded, tradesPerDay, avgEdge, avgWinRate, riskDollars };
    }, [accountSize, mode, weeklyGoal, cfg]);

  const Icon = cfg.icon;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div>
        <div className="label mb-1">Risk Engine</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Goal Planner
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Set a weekly target · get sized positions + trade count
        </p>
      </div>

      {/* Mode selector */}
      <Card>
        <div className="label mb-3">Mode</div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(MODE_CFG) as Mode[]).map((m) => {
            const c = MODE_CFG[m];
            const MIcon = c.icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all",
                  active ? `${c.bg} ${c.border}` : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07]"
                )}
              >
                <MIcon className={cn("h-4 w-4", active ? c.color : "text-fog/60")} />
                <span className={cn("font-mono font-bold text-[11px]", active ? c.color : "text-fog/60")}>
                  {c.label}
                </span>
                <span className="text-[9px] font-mono text-fog/40">{c.riskPct}% risk</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Inputs */}
      <Card>
        <div className="label mb-3">Parameters</div>
        <div className="space-y-4">
          <InputField label="Weekly Goal" value={weeklyGoal} onChange={setWeeklyGoal} prefix="$" step={500} min={500} />
          <InputField label="Account Size" value={accountSize} onChange={setAccountSize} prefix="$" step={5000} min={5000} />
        </div>
      </Card>

      {/* ── Output hero (matches SizerScreen style) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-amber/25 shadow-amber-glow">
        <div className="absolute inset-0 opacity-30 grid-bg" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber/20 blur-3xl animate-aurora-drift" />
        <div className="absolute top-0 left-0 right-0 h-px glow-line" />

        <div className="relative p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", cfg.color)} />
              <span className="text-[10px] font-mono font-bold tracking-[0.14em] uppercase text-amber">
                {cfg.label} Plan
              </span>
            </div>
            <span className="font-mono text-[10px] text-fog tracking-[0.1em]">
              {cfg.riskPct}% · ${(riskDollars).toLocaleString()}/trade
            </span>
          </div>

          {/* Big number — trades needed */}
          <div className="mb-5">
            <div className="text-[10px] font-mono text-fog/50 uppercase tracking-[0.12em] mb-1">
              Trades needed / week
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display font-medium text-7xl leading-none tabular-nums text-gradient-amber">
                {tradesNeeded > 0 ? tradesNeeded : "—"}
              </span>
              {tradesNeeded > 0 && (
                <span className="font-mono text-sm text-fog">
                  ~{tradesPerDay}/day
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.08]">
            <OutputStat
              label="Risk / Trade"
              value={`$${riskDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              icon={<DollarSign className="h-3 w-3" />}
              tone="amber"
            />
            <OutputStat
              label="Edge / Trade"
              value={avgEdge > 0 ? `$${avgEdge.toFixed(0)}` : "—"}
              icon={<TrendingUp className="h-3 w-3" />}
              tone="bull"
            />
            <OutputStat
              label="TP1 Win Rate"
              value={`${avgWinRate.toFixed(0)}%`}
              icon={<Target className="h-3 w-3" />}
              tone="neutral"
            />
            <OutputStat
              label="Weekly Target"
              value={`$${weeklyGoal.toLocaleString()}`}
              icon={<AlertTriangle className="h-3 w-3" />}
              tone={mode === "aggressive" ? "bear" : "neutral"}
            />
          </div>
        </div>
      </div>

      {/* Instrument breakdown table */}
      <Card padded={false}>
        <div className="p-5 pb-3">
          <div className="label mb-0.5">Position Sizing</div>
          <h3 className="font-display text-xl font-medium text-cream tracking-tight">
            By Instrument
          </h3>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-6 gap-1 px-5 py-2 border-t border-white/[0.05]
          text-[8px] font-mono font-bold tracking-[0.12em] text-fog/40 uppercase">
          <span className="col-span-2">Instrument</span>
          <span className="text-center">Cts</span>
          <span className="text-right">SL $</span>
          <span className="text-right">TP1 $</span>
          <span className="text-right">Win%</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {instruments.map((inst) => {
            const hasContracts = inst.contracts > 0;
            return (
              <div
                key={inst.symbol}
                className={cn(
                  "grid grid-cols-6 gap-1 px-5 py-2.5 items-center text-[11px] font-mono",
                  !hasContracts && "opacity-30"
                )}
              >
                <span className="col-span-2 font-bold text-cream">{inst.symbol}</span>
                <span className={cn("text-center font-bold tabular-nums", hasContracts ? cfg.color : "text-fog")}>
                  {hasContracts ? inst.contracts : "—"}
                </span>
                <span className="text-right tabular-nums text-bear">
                  {hasContracts ? `$${inst.actualRisk.toFixed(0)}` : "—"}
                </span>
                <span className="text-right tabular-nums text-bull font-bold">
                  {hasContracts ? `$${inst.tp1.toFixed(0)}` : "—"}
                </span>
                <span className={cn("text-right font-bold tabular-nums", cfg.color)}>
                  {inst.winRate}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {mode === "aggressive" && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-bear/[0.06] border border-bear/20">
          <AlertTriangle className="h-3.5 w-3.5 text-bear/70 flex-shrink-0 mt-px" />
          <p className="text-[10px] text-bear/60 leading-relaxed font-mono">
            AGGRESSIVE — 2.5% risk. A 4-loss streak wipes 10% of capital.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Shared sub-components ── */

function InputField({
  label, value, onChange, prefix, step, min,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; step?: number; min?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium text-cream">{label}</label>
      </div>
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-amber/50 focus-within:bg-white/[0.05] transition-all">
        {prefix && <span className="font-mono text-sm text-fog">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={min}
          className="flex-1 bg-transparent outline-none font-mono font-semibold text-cream text-sm tabular-nums"
        />
      </div>
    </div>
  );
}

function OutputStat({
  label, value, icon, tone,
}: {
  label: string; value: string; icon: React.ReactNode;
  tone: "amber" | "bear" | "bull" | "neutral";
}) {
  const tones = { amber: "text-amber", bear: "text-bear", bull: "text-bull", neutral: "text-cream/70" };
  return (
    <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.06]">
      <div className={cn("flex items-center gap-1 text-[10px] font-mono font-bold tracking-[0.12em] uppercase mb-1", tones[tone])}>
        {icon}{label}
      </div>
      <div className="font-mono font-bold text-sm text-cream tabular-nums">{value}</div>
    </div>
  );
}
