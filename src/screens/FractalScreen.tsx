import { useEffect, useState } from "react";
import { FractalChart } from "../components/fractal/FractalChart";
import { useFractal } from "../hooks/useFractal";
import { useApp } from "../context/AppContext";
import type { FractalResponse, FractalTimeframe } from "../types/fractal";
import type { InstrumentSymbol } from "../types";
import { cn } from "../lib/cn";
import {
  Activity,
  Box,
  Crosshair,
  GitBranch,
  Radio,
  Target,
  Waves,
  Wind,
  X,
  Zap,
} from "lucide-react";

/**
 * FRACTAL — "app-in-app" inside BOVYN.
 *
 * Layout idea: chart is the floor. HUD glass modules float OVER it.
 * No boxed chart. No side panels. The chart is the interface.
 */

const SYMBOLS: InstrumentSymbol[] = ["NQ", "ES", "GC", "CL", "SI", "RTY", "YM"];

const TIMEFRAMES: { label: string; value: FractalTimeframe; interval: string }[] = [
  { label: "1m", value: "1m", interval: "1" },
  { label: "5m", value: "5m", interval: "5" },
  { label: "15m", value: "15m", interval: "15" },
  { label: "1H", value: "1h", interval: "60" },
];

const DIRECTION_OPTIONS = ["AUTO", "LONG", "SHORT"] as const;

const LAYER_TOGGLES: Array<{
  id: "boxes" | "liquidity" | "waves" | "sweeps" | "profile" | "tps";
  label: string;
  icon: typeof Box;
}> = [
  { id: "boxes", label: "Yellow Box", icon: Box },
  { id: "liquidity", label: "Liquidity", icon: Wind },
  { id: "waves", label: "Wave Cone", icon: Target },
  { id: "sweeps", label: "Sweeps", icon: Waves },
  { id: "profile", label: "Vol Profile", icon: Activity },
  { id: "tps", label: "TP Beacons", icon: Zap },
];

export function FractalScreen() {
  const { setActiveScreen } = useApp();
  const [symbol, setSymbol] = useState<InstrumentSymbol>("NQ");
  const [timeframe, setTimeframe] = useState<FractalTimeframe>("5m");
  const [direction, setDirection] =
    useState<(typeof DIRECTION_OPTIONS)[number]>("AUTO");
  const [layers, setLayers] = useState({
    boxes: true,
    liquidity: true,
    waves: true,
    sweeps: true,
    profile: true,
    tps: true,
  });
  const [beat, setBeat] = useState(0);

  // 1-second beat so the heartbeat ring + last-candle pulse feels alive.
  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % 3600), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: liveData, loading, error } = useFractal({ symbol, timeframe, pollMs: 10_000 });

  // Shadow feed not hot? Synthesise a demo snapshot so the chart actually
  // SHOWS what the engine will render. The top-rail status pill is flagged
  // as PREVIEW so it's obvious this isn't live data.
  const hasLive = !!liveData && !!(liveData.long || liveData.short);
  const data = hasLive ? liveData : buildDemoFractal(symbol, timeframe);

  const interval = TIMEFRAMES.find((tf) => tf.value === timeframe)?.interval ?? "5";

  const snap =
    direction === "SHORT"
      ? data?.short
      : direction === "LONG"
        ? data?.long
        : Math.abs(data?.long?.bias_score ?? 0) >= Math.abs(data?.short?.bias_score ?? 0)
          ? data?.long
          : data?.short;

  const engineVersionRaw = liveData?.engine_version;
  const engineVersion =
    engineVersionRaw && engineVersionRaw !== "unavailable" ? engineVersionRaw : "1.0.0";
  const longBias = data?.long?.bias_score ?? 0;
  const shortBias = data?.short?.bias_score ?? 0;
  const netBias = longBias - shortBias; // [-1..1] roughly
  const status: "ONLINE" | "OFFLINE" | "BOOTING" | "PREVIEW" =
    loading && !liveData ? "BOOTING"
    : error ? "OFFLINE"
    : hasLive ? "ONLINE"
    : "PREVIEW";

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#07070a] text-cream selection:bg-amber/30">
      {/* ══════════════════ CHART FLOOR ══════════════════ */}
      <div className="absolute inset-0 z-0">
        <FractalChart
          symbol={symbol}
          interval={interval}
          fractal={data ?? null}
          direction={direction}
          layers={layers}
          beat={beat}
        />
      </div>

      {/* Vignette over chart for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ══════════════════ TOP RAIL ══════════════════ */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        {/* Close */}
        <button
          onClick={() => setActiveScreen("signals")}
          aria-label="Close Fractal"
          className="group h-10 w-10 rounded-xl bg-black/55 border border-white/[0.08] backdrop-blur-xl flex items-center justify-center text-cream/70 hover:border-amber/60 hover:text-amber transition"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3 rounded-2xl bg-black/55 backdrop-blur-xl border border-amber/25 px-3 py-2 shadow-[0_0_50px_-12px_rgba(240,160,32,0.4)]">
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber/40 to-amber/10 border border-amber/50 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-amber" strokeWidth={2.5} />
            </div>
            <span
              className={cn(
                "absolute -top-1 -right-1 h-2 w-2 rounded-full ring-2 ring-black/80",
                status === "ONLINE"
                  ? "bg-emerald-400 animate-pulse-dot"
                  : status === "BOOTING"
                    ? "bg-amber animate-pulse-dot"
                    : status === "PREVIEW"
                      ? "bg-violet-400 animate-pulse-dot"
                      : "bg-red-500",
              )}
            />
          </div>
          <div className="leading-none">
            <div className="flex items-baseline gap-2">
              <span className="text-[20px] md:text-[22px] font-serif italic tracking-tight text-cream">
                Fractal
              </span>
              <span className="text-[9px] font-mono font-bold tracking-[0.3em] uppercase text-amber/80">
                Engine
              </span>
            </div>
            <div className="text-[9px] font-mono tracking-[0.22em] uppercase text-cream/45 mt-0.5">
              v{engineVersion} · SHADOW MODE · BOVYN
            </div>
          </div>
        </div>

        {/* Telemetry */}
        <div className="hidden md:flex items-center gap-2">
          <Telem label="Pivots"  value={data?.pivots?.length ?? 0} />
          <Telem label="Sweeps"  value={data?.recent_sweeps?.length ?? 0} />
          <Telem label="Boxes"   value={snap?.active_boxes?.length ?? 0} />
          <Telem label="Lat"     value={snap?.computed_ms ? `${snap.computed_ms}ms` : "—"} />
        </div>

        {/* Status ring */}
        <div className="flex items-center gap-2">
          <StatusPulse status={status} beat={beat} />
        </div>
      </header>

      {/* ══════════════════ SYMBOL + BIAS STRIP ══════════════════ */}
      <div className="absolute top-[72px] md:top-[80px] inset-x-0 z-20 flex flex-col items-center gap-2 px-4 md:px-6">
        {/* Symbol rail */}
        <div className="flex items-center gap-1 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/[0.08] px-1.5 py-1.5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.9)]">
          {SYMBOLS.map((s) => {
            const active = s === symbol;
            return (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={cn(
                  "relative h-8 px-3 rounded-xl text-[11px] font-mono font-bold tracking-[0.22em] uppercase transition-all",
                  active
                    ? "bg-gradient-to-b from-amber/30 to-amber/10 text-amber border border-amber/50 shadow-[0_0_20px_-4px_rgba(240,160,32,0.6)]"
                    : "text-cream/55 hover:text-cream hover:bg-white/[0.05]",
                )}
              >
                {s}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-5 bg-amber rounded-full shadow-[0_0_12px_rgba(240,160,32,0.9)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bias meter */}
        <BiasMeter net={netBias} longScore={longBias} shortScore={shortBias} />
      </div>

      {/* ══════════════════ LEFT STATION STACK ══════════════════ */}
      <aside className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 w-[260px] max-w-[calc(100vw-24px)] hidden lg:flex">
        <Station
          accent="amber"
          icon={<Crosshair className="h-3.5 w-3.5" strokeWidth={2.25} />}
          title="Vector"
          tag={snap?.vector?.kind?.replace("_", " ") ?? "—"}
        >
          {snap?.vector ? (
            <>
              <Row label="Direction" value={snap.vector.direction} tone={snap.vector.direction === "LONG" ? "bull" : snap.vector.direction === "SHORT" ? "bear" : "neutral"} />
              <Bar label="Confidence" value={snap.vector.confidence} tone="amber" />
              {snap.vector.historical_wr != null && (
                <Row
                  label={`Hist WR · n=${snap.vector.historical_n}`}
                  value={`${Math.round(snap.vector.historical_wr * 100)}%`}
                  tone={snap.vector.historical_wr >= 0.5 ? "bull" : "bear"}
                />
              )}
              <Row label="Bars span" value={snap.vector.bars_span} />
            </>
          ) : (
            <Empty>feed offline — flip FRACTAL_ICT_SHADOW=1</Empty>
          )}
        </Station>

        <Station
          accent="cyan"
          icon={<Waves className="h-3.5 w-3.5" strokeWidth={2.25} />}
          title="Wave"
          tag={snap?.wave?.phase?.replace("_", " ") ?? "—"}
        >
          {snap?.wave ? (
            <>
              <Row label="Bars remain"    value={snap.wave.bars_remaining} />
              <Row label="IV burn remain" value={`${(snap.wave.iv_burn_remaining * 100).toFixed(0)}%`} />
              <Bar label="Confidence"     value={snap.wave.confidence} tone="cyan" />
            </>
          ) : (
            <Empty>awaiting wave projection</Empty>
          )}
        </Station>

        <Station
          accent="violet"
          icon={<Radio className="h-3.5 w-3.5" strokeWidth={2.25} />}
          title="Bias Matrix"
        >
          <div className="grid grid-cols-2 gap-2">
            <BiasCell label="LONG"  score={longBias}  tone="bull" />
            <BiasCell label="SHORT" score={shortBias} tone="bear" />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[9px] font-mono tracking-[0.22em] uppercase text-cream/40">
            <span>Session</span>
            <span className="text-cream/75">{snap?.session ?? "—"}</span>
          </div>
        </Station>
      </aside>

      {/* ══════════════════ RIGHT: TP LADDER (above chart's VP) ══════════════════ */}
      <aside className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 w-[240px] max-w-[calc(100vw-24px)] hidden lg:flex">
        <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-amber/25 shadow-[0_20px_60px_-20px_rgba(240,160,32,0.35)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-amber" strokeWidth={2.25} />
              <span className="text-[10px] font-mono font-bold tracking-[0.28em] uppercase text-cream/75">TP Ladder</span>
            </div>
            <span className="text-[9px] font-mono tracking-[0.22em] uppercase text-cream/40">
              {snap?.direction ?? "—"}
            </span>
          </div>
          <div className="p-2 space-y-1.5">
            <TpRung label="TP1"  price={snap?.tp_plan?.tp1} tone="lime" />
            <TpRung label="TP2"  price={snap?.tp_plan?.tp2} tone="emerald" />
            <TpRung label="TP3"  price={snap?.tp_plan?.tp3} tone="cyan" />
            <div className="h-px bg-white/[0.06] my-1" />
            <TpRung label="STOP" price={snap?.tp_plan?.stop} tone="red" />
          </div>
          {snap?.tp_plan?.rationale && (
            <div className="px-3 py-2 border-t border-white/[0.06] text-[9px] font-mono tracking-[0.08em] text-cream/50 italic">
              {snap.tp_plan.rationale}
            </div>
          )}
        </div>

        {/* Zone matrix */}
        <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/[0.08] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Box className="h-3.5 w-3.5 text-amber" strokeWidth={2.25} />
              <span className="text-[10px] font-mono font-bold tracking-[0.28em] uppercase text-cream/75">Yellow Box</span>
            </div>
            <span className="text-[9px] font-mono tracking-[0.22em] uppercase text-cream/40">
              {snap?.active_boxes?.length ?? 0} active
            </span>
          </div>
          <div className="p-2 space-y-1 max-h-[180px] overflow-y-auto">
            {snap?.active_boxes?.length ? (
              snap.active_boxes.map((b, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/[0.04] px-2 py-1.5">
                  <span className={cn(
                    "text-[9px] font-mono font-bold tracking-[0.18em] uppercase px-1.5 py-0.5 rounded",
                    b.status === "DEFENDED" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
                    b.status === "LEAKING" && "bg-red-500/15 text-red-400 border border-red-500/30",
                    b.status === "UNKNOWN" && "bg-amber/15 text-amber border border-amber/30",
                    b.status === "EXPIRED" && "bg-white/[0.05] text-cream/45 border border-white/10",
                  )}>
                    {b.status}
                  </span>
                  <div className="text-right leading-tight">
                    <div className="text-[10px] font-mono font-bold text-cream/85">
                      {b.lower.toFixed(2)}—{b.upper.toFixed(2)}
                    </div>
                    <div className="text-[8px] font-mono text-cream/45 tracking-[0.15em]">
                      {(b.containment_prob * 100).toFixed(0)}% · n={b.sample_n}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty>no active containment zones</Empty>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════ BOTTOM CONTROL DOCK ══════════════════ */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 w-[calc(100vw-24px)] max-w-3xl">
        {/* Layer toggles */}
        <div className="flex items-center gap-1 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/[0.08] px-1.5 py-1.5">
          {LAYER_TOGGLES.map((l) => {
            const on = layers[l.id];
            const Icon = l.icon;
            return (
              <button
                key={l.id}
                onClick={() => setLayers((s) => ({ ...s, [l.id]: !s[l.id] }))}
                className={cn(
                  "group h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-[0.18em] uppercase transition-all",
                  on
                    ? "bg-amber/15 text-amber border border-amber/35"
                    : "text-cream/40 hover:text-cream/70 border border-transparent",
                )}
              >
                <Icon className="h-3 w-3" strokeWidth={2.25} />
                <span className="hidden sm:inline">{l.label}</span>
              </button>
            );
          })}
        </div>

        {/* TF + Direction */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-2xl bg-black/65 backdrop-blur-xl border border-white/[0.08] p-1">
            {TIMEFRAMES.map((tf) => {
              const on = tf.value === timeframe;
              return (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={cn(
                    "h-9 px-3.5 rounded-xl text-[11px] font-mono font-bold tracking-[0.22em] uppercase transition-all",
                    on
                      ? "bg-amber text-bg shadow-[0_0_20px_-4px_rgba(240,160,32,0.7)]"
                      : "text-cream/55 hover:text-cream",
                  )}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

          <div className="flex rounded-2xl bg-black/65 backdrop-blur-xl border border-white/[0.08] p-1">
            {DIRECTION_OPTIONS.map((d) => {
              const on = d === direction;
              const tone = d === "LONG" ? "emerald" : d === "SHORT" ? "red" : "amber";
              return (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={cn(
                    "h-9 px-3.5 rounded-xl text-[11px] font-mono font-bold tracking-[0.22em] uppercase transition-all",
                    on && tone === "amber" && "bg-amber text-bg",
                    on && tone === "emerald" && "bg-emerald-500 text-bg",
                    on && tone === "red" && "bg-red-500 text-bg",
                    !on && "text-cream/55 hover:text-cream",
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Corner brackets — command-centre accents */}
      <CornerBrackets />

      {/* Mobile hint panel */}
      <div className="lg:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-lg bg-black/65 backdrop-blur-xl border border-amber/20 px-3 py-1.5 text-[9px] font-mono tracking-[0.22em] uppercase text-cream/50">
        HUD stations on desktop
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Sub-components                                            */
/* ─────────────────────────────────────────────────────────── */

function Telem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="h-10 rounded-xl bg-black/55 backdrop-blur-xl border border-white/[0.06] px-3 flex flex-col justify-center min-w-[70px]">
      <div className="text-[8px] font-mono tracking-[0.3em] uppercase text-cream/40 leading-none">{label}</div>
      <div className="text-[13px] font-mono font-bold text-cream/90 leading-none mt-1">{value}</div>
    </div>
  );
}

function StatusPulse({ status, beat }: { status: "ONLINE" | "OFFLINE" | "BOOTING" | "PREVIEW"; beat: number }) {
  const angle = (beat * 8) % 360;
  const tone =
    status === "ONLINE" ? "rgba(34,197,94,0.95)"
    : status === "BOOTING" ? "rgba(240,160,32,0.95)"
    : status === "PREVIEW" ? "rgba(139,92,246,0.95)"
    : "rgba(239,68,68,0.9)";
  return (
    <div className="relative h-10 w-10 rounded-xl bg-black/55 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0.5 rounded-lg"
        style={{
          background: `conic-gradient(from ${angle}deg, ${tone} 0deg, transparent 120deg)`,
          maskImage: "radial-gradient(circle, transparent 55%, black 58%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 55%, black 58%)",
        }}
      />
      <div className="relative z-10 text-[8px] font-mono font-bold tracking-[0.18em] uppercase" style={{ color: tone }}>
        {status.slice(0, 3)}
      </div>
    </div>
  );
}

function BiasMeter({ net, longScore, shortScore }: { net: number; longScore: number; shortScore: number }) {
  const pct = Math.max(-1, Math.min(1, net)) * 50 + 50; // 0..100
  return (
    <div className="flex items-center gap-3 rounded-full bg-black/55 backdrop-blur-xl border border-white/[0.06] px-3 py-1.5">
      <span className="text-[9px] font-mono font-bold tracking-[0.22em] uppercase text-red-400 min-w-[50px] text-right">
        SHORT · {shortScore.toFixed(2)}
      </span>
      <div className="relative w-[320px] h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background:
              net >= 0
                ? "linear-gradient(90deg, transparent, rgba(240,160,32,0.7))"
                : "linear-gradient(90deg, rgba(239,68,68,0.7), transparent)",
          }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber shadow-[0_0_10px_rgba(240,160,32,0.9)] border border-black"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <span className="text-[9px] font-mono font-bold tracking-[0.22em] uppercase text-emerald-400 min-w-[50px]">
        LONG · {longScore.toFixed(2)}
      </span>
    </div>
  );
}

function Station({
  accent,
  icon,
  title,
  tag,
  children,
}: {
  accent: "amber" | "cyan" | "violet";
  icon: React.ReactNode;
  title: string;
  tag?: string;
  children: React.ReactNode;
}) {
  const accentColor =
    accent === "amber" ? "rgba(240,160,32,0.35)"
    : accent === "cyan" ? "rgba(56,189,248,0.35)"
    : "rgba(139,92,246,0.35)";
  const accentText =
    accent === "amber" ? "text-amber"
    : accent === "cyan" ? "text-cyan-400"
    : "text-violet-400";
  return (
    <div
      className="relative rounded-2xl bg-black/60 backdrop-blur-xl border overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
      style={{ borderColor: accentColor }}
    >
      {/* Top rail */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className={cn("flex items-center gap-1.5", accentText)}>
          {icon}
          <span className="text-[10px] font-mono font-bold tracking-[0.28em] uppercase">{title}</span>
        </div>
        {tag && (
          <span className="text-[9px] font-mono font-bold tracking-[0.18em] uppercase text-cream/60">
            {tag}
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">{children}</div>
      {/* inner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: `inset 0 0 40px -10px ${accentColor}` }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "bull" | "bear" | "amber" | "neutral";
}) {
  const t =
    tone === "bull" ? "text-emerald-400"
    : tone === "bear" ? "text-red-400"
    : tone === "amber" ? "text-amber"
    : "text-cream/85";
  return (
    <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.08em]">
      <span className="text-cream/45 uppercase tracking-[0.18em] text-[9px]">{label}</span>
      <span className={cn("font-bold", t)}>{value}</span>
    </div>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: "amber" | "cyan" }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const col = tone === "amber" ? "#F0A020" : "#38bdf8";
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.18em] uppercase mb-1">
        <span className="text-cream/45">{label}</span>
        <span className="text-cream/85 font-bold">{Math.round(pct)}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${col}55, ${col})`,
            boxShadow: `0 0 10px ${col}80`,
          }}
        />
      </div>
    </div>
  );
}

function BiasCell({ label, score, tone }: { label: string; score: number; tone: "bull" | "bear" }) {
  const pct = Math.min(1, Math.abs(score)) * 100;
  const col = tone === "bull" ? "#34d399" : "#f87171";
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-2">
      <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.22em] uppercase text-cream/45">
        <span>{label}</span>
        <span style={{ color: col }} className="font-bold">{score.toFixed(2)}</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${col}55, ${col})`,
            boxShadow: `0 0 10px ${col}70`,
          }}
        />
      </div>
    </div>
  );
}

function TpRung({
  label,
  price,
  tone,
}: {
  label: string;
  price?: number;
  tone: "lime" | "emerald" | "cyan" | "red";
}) {
  const colMap: Record<string, string> = {
    lime: "#a3e635",
    emerald: "#34d399",
    cyan: "#22d3ee",
    red: "#f87171",
  };
  const col = colMap[tone];
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-2 py-1.5">
      <span
        className="text-[9px] font-mono font-bold tracking-[0.22em] uppercase px-1.5 py-0.5 rounded"
        style={{
          color: col,
          background: `${col}14`,
          border: `1px solid ${col}40`,
        }}
      >
        {label}
      </span>
      <span className="flex-1" />
      <span className="text-[11px] font-mono font-bold text-cream/90">
        {price != null ? price.toFixed(2) : "—"}
      </span>
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: col, boxShadow: `0 0 8px ${col}` }}
      />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-2 text-center text-[9px] font-mono tracking-[0.18em] uppercase text-cream/35 italic">
      {children}
    </div>
  );
}

function CornerBrackets() {
  const base = "absolute z-10 h-8 w-8 border-amber/45 pointer-events-none";
  return (
    <>
      <div className={cn(base, "top-2 left-2 border-l-2 border-t-2 rounded-tl-lg")} />
      <div className={cn(base, "top-2 right-2 border-r-2 border-t-2 rounded-tr-lg")} />
      <div className={cn(base, "bottom-2 left-2 border-l-2 border-b-2 rounded-bl-lg")} />
      <div className={cn(base, "bottom-2 right-2 border-r-2 border-b-2 rounded-br-lg")} />
    </>
  );
}

/* ───────────── Demo fractal fabricator ─────────────
 * Synthesises a realistic-looking snapshot so the HUD shows every feature
 * (Yellow Box, wave cone, sweeps, liquidity columns, TP ladder) even when
 * the shadow_fractal table on the VPS is still empty.
 */

function hashS(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildDemoFractal(symbol: string, timeframe: FractalTimeframe): FractalResponse {
  // Rough anchors so demo sits over the real level band
  const anchors: Record<string, number> = {
    NQ: 24350,
    ES: 5880,
    GC: 2685,
    CL: 71.5,
    SI: 31.25,
    RTY: 2310,
    YM: 43950,
  };
  const price = anchors[symbol] ?? 24000;
  const seed = hashS(symbol + timeframe);
  const rng = ((s: number) => () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 1e6) / 1e6;
  })(seed);
  const spread = price * 0.008;
  const now = Date.now();

  const longBias = 0.42 + rng() * 0.35;
  const shortBias = -(0.2 + rng() * 0.25);

  return {
    symbol,
    timeframe,
    ts_last: now,
    price_last: price,
    engine_version: "1.0.0-preview",
    pivots: Array.from({ length: 6 }, (_, i) => ({
      ts: now - (i + 1) * 600_000,
      price: price + (rng() - 0.4) * spread * 3,
      kind: i % 2 === 0 ? "HIGH" : "LOW",
      timeframe,
      strength: 0.5 + rng() * 0.5,
      confirmed: i > 0,
    })),
    recent_sweeps: [
      { ts: now - 1_800_000, price: price + spread * 1.4, side: "BSL", confirmed: true },
      { ts: now - 900_000, price: price - spread * 1.1, side: "SSL", confirmed: false },
    ],
    long: {
      symbol,
      direction: "LONG",
      ts: now,
      session: "NY PM",
      timeframe,
      vector: {
        kind: "RETEST_HOLD",
        direction: "LONG",
        confidence: 0.72,
        historical_wr: 0.64,
        historical_n: 178,
        bars_span: 8,
      },
      wave: { phase: "EXPANSION", bars_remaining: 14, iv_burn_remaining: 0.55, confidence: 0.58 },
      tp_plan: {
        tp1: price + spread * 0.5,
        tp2: price + spread * 1.2,
        tp3: price + spread * 2.1,
        stop: price - spread * 0.9,
        iv_target_range: [0.18, 0.32],
        atr_floor: spread * 0.7,
        gex_walls_used: [],
        rationale: "Bull Yellow Box defended · VWAP + EMA21 stack · NY PM expansion window.",
      },
      active_boxes: [
        {
          upper: price + spread * 0.25,
          lower: price - spread * 0.25,
          mid: price,
          containment_prob: 0.78,
          sample_n: 42,
          status: "DEFENDED",
          of_confidence: 0.7,
          anchor_ts: now - 3_600_000,
          anchor_kind: "LOW",
        },
        {
          upper: price + spread * 1.6,
          lower: price + spread * 1.2,
          mid: price + spread * 1.4,
          containment_prob: 0.55,
          sample_n: 19,
          status: "UNKNOWN",
          of_confidence: 0.45,
          anchor_ts: now - 7_200_000,
          anchor_kind: "HIGH",
        },
      ],
      bias_score: longBias,
      engine_version: "1.0.0-preview",
      computed_ms: 42,
    },
    short: {
      symbol,
      direction: "SHORT",
      ts: now,
      session: "NY PM",
      timeframe,
      vector: {
        kind: "FAIL_B",
        direction: "SHORT",
        confidence: 0.44,
        historical_wr: 0.48,
        historical_n: 94,
        bars_span: 5,
      },
      wave: { phase: "RECLAIM", bars_remaining: 6, iv_burn_remaining: 0.22, confidence: 0.39 },
      tp_plan: {
        tp1: price - spread * 0.4,
        tp2: price - spread * 0.9,
        tp3: price - spread * 1.7,
        stop: price + spread * 0.7,
        iv_target_range: [0.2, 0.3],
        atr_floor: spread * 0.6,
        gex_walls_used: [],
        rationale: "Bear Yellow Box leaking · failed B retest.",
      },
      active_boxes: [
        {
          upper: price - spread * 0.8,
          lower: price - spread * 1.3,
          mid: price - spread * 1.05,
          containment_prob: 0.41,
          sample_n: 23,
          status: "LEAKING",
          of_confidence: 0.35,
          anchor_ts: now - 5_400_000,
          anchor_kind: "HIGH",
        },
      ],
      bias_score: shortBias,
      engine_version: "1.0.0-preview",
      computed_ms: 38,
    },
  };
}
