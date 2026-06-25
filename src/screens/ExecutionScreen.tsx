import { useState } from "react";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { gates } from "../lib/tierGates";
import { INSTRUMENTS } from "../data/instruments";
import { cn } from "../lib/cn";
import { Power, Shield, ShieldAlert, Zap, Link2, Clock3 } from "lucide-react";

type Profile = "conservative" | "balanced" | "aggressive";

const PROFILES: { id: Profile; name: string; detail: string }[] = [
  {
    id: "conservative",
    name: "Conservative",
    detail: "A+ and S++ only · TP1 partial exits",
  },
  {
    id: "balanced",
    name: "Balanced",
    detail: "All grades · scaled TP1/TP2/TP3",
  },
  {
    id: "aggressive",
    name: "Aggressive",
    detail: "Full position held to TP2/TP3",
  },
];

export function ExecutionScreen() {
  const { tier, setTier } = useApp();
  const canExecute = gates.execution(tier);
  const [masterOn, setMasterOn] = useState(true);
  const [profile, setProfile] = useState<Profile>("balanced");
  const [dailyLimit, setDailyLimit] = useState(1500);
  const [maxDrawdown, setMaxDrawdown] = useState(3000);
  const [sessionKill, setSessionKill] = useState(false);
  const [consecLosses, setConsecLosses] = useState(3);
  const [instrumentToggles, setInstrumentToggles] = useState<Record<string, boolean>>({
    NQ: true, ES: true, YM: false, RTY: true, CL: true, GC: true, SI: false,
  });

  return (
    <div className="relative space-y-4 pb-4">
      <div>
        <div className="label mb-1">Auto-Trade</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Execution
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Auto-execution controls · risk manager · circuit breakers
        </p>
      </div>

      <div className={cn("space-y-4", !canExecute && "pointer-events-none select-none")}>
        {/* Master toggle — hero card */}
        <div className="relative overflow-hidden rounded-2xl bg-surface border border-amber/30 shadow-amber-glow">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber/20 blur-3xl animate-aurora-drift" />
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute top-0 left-0 right-0 h-px glow-line" />
          <div className="relative p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center border",
                    masterOn
                      ? "bg-bull/10 text-bull border-bull/30 shadow-[0_0_24px_-4px_rgba(16,200,100,0.5)]"
                      : "bg-white/[0.04] text-fog border-white/[0.1]"
                  )}
                >
                  <Power className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-medium text-cream tracking-tight">
                      Master Execution
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded border",
                        masterOn ? "bg-bull/10 text-bull border-bull/30" : "bg-white/[0.04] text-fog border-white/[0.1]"
                      )}
                    >
                      {masterOn ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Link2 className="h-3 w-3 text-fog" />
                    <span className="text-[11px] text-fog font-mono">
                      Topstep 150k · Rithmic
                    </span>
                  </div>
                </div>
              </div>
              <Toggle value={masterOn} onChange={setMasterOn} size="lg" />
            </div>

            {masterOn && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-amber/[0.06] border border-amber/20">
                <Clock3 className="h-3.5 w-3.5 text-amber flex-shrink-0" />
                <span className="text-[11px] font-mono text-cream/90 flex-1">
                  Next eligible: <span className="text-amber font-bold">NQ · NY AM</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-amber tracking-[0.08em]">
                  IN 23M
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/[0.08]">
              <TodayStat label="Trades" value="4" />
              <TodayStat label="P&L" value="+$1,240" tone="bull" />
              <TodayStat label="Win %" value="75%" tone="amber" />
            </div>
          </div>
        </div>

        {/* Profile selector */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber" />
            <h3 className="font-display text-xl font-medium text-cream tracking-tight">Execution Profile</h3>
          </div>
          <div className="space-y-2">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border transition-all ring-focus",
                  profile === p.id
                    ? "bg-amber/[0.06] border-amber/40 shadow-amber-glow-sm"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-amber/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-cream text-sm">{p.name}</div>
                    <div className="text-[11px] text-fog mt-0.5 font-light">{p.detail}</div>
                  </div>
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      profile === p.id
                        ? "border-amber bg-amber"
                        : "border-white/20 bg-transparent"
                    )}
                  >
                    {profile === p.id && <div className="h-1.5 w-1.5 rounded-full bg-bg" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Risk controls */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-amber" />
            <h3 className="font-display text-xl font-medium text-cream tracking-tight">Risk Manager</h3>
          </div>
          <div className="space-y-3">
            <NumberRow
              label="Daily Loss Limit"
              value={dailyLimit}
              prefix="$"
              onChange={setDailyLimit}
            />
            <NumberRow
              label="Max Drawdown"
              value={maxDrawdown}
              prefix="$"
              onChange={setMaxDrawdown}
            />
            <ToggleRow
              label="Session Kill Switch"
              detail="Pause execution between sessions"
              value={sessionKill}
              onChange={setSessionKill}
              icon={<ShieldAlert className="h-3.5 w-3.5" />}
            />
            <NumberRow
              label="Pause after N consecutive losses"
              value={consecLosses}
              onChange={setConsecLosses}
              suffix="losses"
            />
          </div>
        </Card>

        {/* Per-instrument toggles */}
        <Card>
          <h3 className="font-display text-xl font-medium text-cream mb-3 tracking-tight">
            Per-Instrument Execution
          </h3>
          <div className="space-y-2">
            {INSTRUMENTS.map((inst) => (
              <div
                key={inst.symbol}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-cream w-9">
                    {inst.symbol}
                  </span>
                  <span className="text-xs text-fog font-light">{inst.name}</span>
                </div>
                <Toggle
                  value={instrumentToggles[inst.symbol]}
                  onChange={(v) =>
                    setInstrumentToggles((prev) => ({ ...prev, [inst.symbol]: v }))
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {!canExecute && (
        <LockOverlay
          requiredTier="Execute"
          title="Auto-Execution Locked"
          description="Execute tier connects BOVYN to a funded account, with a live risk manager, circuit breakers, and per-instrument toggles."
          onUpgrade={() => setTier("execute")}
        />
      )}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  size = "md",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  size?: "md" | "lg";
}) {
  const dims = size === "lg" ? "h-7 w-12" : "h-6 w-10";
  const knob = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const off = "translate-x-0.5";
  const on = size === "lg" ? "translate-x-[22px]" : "translate-x-[18px]";

  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors ring-focus flex-shrink-0",
        dims,
        value ? "bg-amber shadow-amber-glow-sm" : "bg-white/[0.1]"
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full shadow transform transition-transform",
          knob,
          value ? "bg-bg" : "bg-cream",
          value ? on : off
        )}
      />
    </button>
  );
}

function NumberRow({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-cream/90">{label}</span>
      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 focus-within:border-amber/40">
        {prefix && <span className="font-mono text-xs text-fog">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-20 bg-transparent outline-none font-mono font-bold text-sm text-cream text-right tabular-nums"
        />
        {suffix && <span className="font-mono text-[10px] text-fog">{suffix}</span>}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  detail,
  value,
  onChange,
  icon,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-2">
        {icon && <span className="text-amber mt-0.5">{icon}</span>}
        <div>
          <div className="text-xs font-medium text-cream">{label}</div>
          <div className="text-[10px] text-fog font-light">{detail}</div>
        </div>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function TodayStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bull" | "amber";
}) {
  return (
    <div>
      <div className="text-[10px] font-mono font-bold tracking-[0.14em] uppercase text-fog">
        {label}
      </div>
      <div
        className={cn(
          "font-mono font-bold text-lg tabular-nums",
          tone === "bull" ? "text-bull" : tone === "amber" ? "text-amber" : "text-cream"
        )}
      >
        {value}
      </div>
    </div>
  );
}
