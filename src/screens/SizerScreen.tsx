import { useMemo, useState } from "react";
import { INSTRUMENTS } from "../data/instruments";
import type { InstrumentSymbol } from "../types";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { gates } from "../lib/tierGates";
import { calculatePosition } from "../lib/positionSizer";
import { cn } from "../lib/cn";
import { Calculator, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export function SizerScreen() {
  const { tier, setTier } = useApp();
  const canUse = gates.positionSizer(tier);
  const [symbol, setSymbol] = useState<InstrumentSymbol>("NQ");
  const [accountSize, setAccountSize] = useState(100000);
  const [riskPct, setRiskPct] = useState(1);
  const [stopPoints, setStopPoints] = useState(15);

  const instrument = INSTRUMENTS.find((i) => i.symbol === symbol)!;

  const calc = useMemo(
    () => calculatePosition({ accountSize, riskPct, stopPoints, instrument }),
    [accountSize, riskPct, stopPoints, instrument]
  );

  return (
    <div className="relative space-y-4 pb-4">
      <div>
        <div className="label mb-1">Risk Engine</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Position Sizer
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Dynamic contract sizing across all 7 instruments
        </p>
      </div>

      <div className={cn(!canUse && "pointer-events-none select-none")}>
        {/* Instrument grid */}
        <Card>
          <div className="label mb-3">Instrument</div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst.symbol}
                onClick={() => setSymbol(inst.symbol)}
                className={cn(
                  "px-2 py-2.5 rounded-xl font-mono font-bold text-xs transition-all ring-focus",
                  symbol === inst.symbol
                    ? "bg-amber text-bg shadow-amber-glow-sm"
                    : "bg-white/[0.04] border border-white/[0.08] text-cream/80 hover:text-cream hover:border-amber/30"
                )}
              >
                {inst.symbol}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/[0.07]">
            <div>
              <div className="label mb-0.5">
                {instrument.name}
              </div>
              <div className="text-xs text-cream/80 mt-0.5 font-light">
                Tick: {instrument.tickSize} · Value: ${instrument.tickValue.toFixed(2)}
              </div>
            </div>
            <div className="font-mono font-bold text-sm text-amber">
              ${instrument.pointValue}/pt
            </div>
          </div>
        </Card>

        {/* Inputs */}
        <Card className="mt-4">
          <div className="label mb-3">Risk Parameters</div>
          <div className="space-y-4">
            <InputField
              label="Account Size"
              value={accountSize}
              onChange={setAccountSize}
              prefix="$"
              min={1000}
              step={1000}
            />
            <InputField
              label="Risk per trade"
              value={riskPct}
              onChange={setRiskPct}
              suffix="%"
              min={0.25}
              max={5}
              step={0.25}
            />
            <InputField
              label="Stop Distance"
              value={stopPoints}
              onChange={setStopPoints}
              suffix="pts"
              min={1}
              step={1}
            />
          </div>
        </Card>

        {/* Output — amber hero card */}
        <div className="mt-4 relative overflow-hidden rounded-2xl bg-surface border border-amber/25 shadow-amber-glow">
          <div className="absolute inset-0 opacity-30 grid-bg" />
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber/20 blur-3xl animate-aurora-drift" />
          <div className="absolute top-0 left-0 right-0 h-px glow-line" />

          <div className="relative p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-amber" />
                <span className="text-[10px] font-mono font-bold tracking-[0.14em] uppercase text-amber">
                  Sized Position
                </span>
              </div>
              <span className="font-mono text-[10px] text-fog tracking-[0.1em]">
                {instrument.symbol} · {instrument.name}
              </span>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-3">
                <span className="font-display font-medium text-7xl leading-none tabular-nums text-gradient-amber">
                  {calc.contracts}
                </span>
                <span className="font-mono text-sm text-fog">
                  contract{calc.contracts === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.08]">
              <OutputStat
                label="Risk"
                value={`$${calc.riskDollars.toFixed(0)}`}
                icon={<DollarSign className="h-3 w-3" />}
                tone="amber"
              />
              <OutputStat
                label="Stop cost / ct"
                value={`$${calc.stopCostPerContract.toFixed(0)}`}
                icon={<AlertTriangle className="h-3 w-3" />}
                tone="neutral"
              />
              <OutputStat
                label="Max Loss"
                value={`$${calc.maxLoss.toFixed(0)}`}
                icon={<AlertTriangle className="h-3 w-3" />}
                tone="bear"
              />
              <OutputStat
                label="TP1 Profit (1.5R)"
                value={`+$${calc.tp1Profit.toFixed(0)}`}
                icon={<TrendingUp className="h-3 w-3" />}
                tone="bull"
              />
            </div>
          </div>
        </div>
      </div>

      {!canUse && (
        <LockOverlay
          requiredTier="Intel"
          title="Position Sizer Locked"
          description="Intel unlocks dynamic contract sizing across all 7 instruments with risk and R-multiple outputs."
          onUpgrade={() => setTier("intel")}
        />
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium text-cream">{label}</label>
        <span className="text-[10px] font-mono text-fog">
          {min !== undefined && `min ${min}`}
          {max !== undefined && ` · max ${max}`}
        </span>
      </div>
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-amber/50 focus-within:bg-white/[0.05] transition-all">
        {prefix && <span className="font-mono text-sm text-fog">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="flex-1 bg-transparent outline-none font-mono font-semibold text-cream text-sm tabular-nums"
        />
        {suffix && <span className="font-mono text-sm text-fog">{suffix}</span>}
      </div>
    </div>
  );
}

function OutputStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "amber" | "bear" | "bull" | "neutral";
}) {
  const tones = {
    amber: "text-amber",
    bear: "text-bear",
    bull: "text-bull",
    neutral: "text-cream/70",
  };
  return (
    <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.06]">
      <div className={cn("flex items-center gap-1 text-[10px] font-mono font-bold tracking-[0.12em] uppercase mb-1", tones[tone])}>
        {icon}
        {label}
      </div>
      <div className="font-mono font-bold text-sm text-cream tabular-nums">{value}</div>
    </div>
  );
}
