import { useState, useEffect, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { useReplay } from "../hooks/useReplay";
import { gates } from "../lib/tierGates";
import { cn } from "../lib/cn";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Rewind,
  FastForward,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ReplayCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ReplaySignal {
  time: string;
  direction: "LONG" | "SHORT";
  grade: string;
  entry: number;
  result: string;
  pnl: number;
}

interface ReplayDay {
  date: string;
  label: string;
  instrument: string;
  session: string;
  candles: ReplayCandle[];
  signals: ReplaySignal[];
  totalPnl: number;
}

// Mock replay data
const REPLAY_DAY: ReplayDay = {
  date: "2026-04-04",
  label: "Thursday, Apr 3",
  instrument: "NQ",
  session: "NY AM",
  candles: Array.from({ length: 60 }, (_, i) => {
    const base = 24300 + Math.sin(i * 0.15) * 50 + i * 1.5;
    const range = 8 + Math.random() * 12;
    const open = base + (Math.random() - 0.5) * range;
    const close = base + (Math.random() - 0.5) * range;
    return {
      time: `09:${String(30 + Math.floor(i / 2)).padStart(2, "0")}`,
      open,
      high: Math.max(open, close) + Math.random() * 5,
      low: Math.min(open, close) - Math.random() * 5,
      close,
    };
  }),
  signals: [
    { time: "09:31", direction: "LONG", grade: "S++", entry: 24332, result: "TP2 Hit", pnl: 720 },
    { time: "09:50", direction: "LONG", grade: "A+", entry: 24355, result: "TP1 Hit", pnl: 380 },
    { time: "10:22", direction: "SHORT", grade: "A", entry: 24380, result: "Stopped", pnl: -260 },
  ],
  totalPnl: 840,
};

const AVAILABLE_DAYS = [
  { date: "2026-04-06", label: "Mon Apr 6", pnl: 3390 },
  { date: "2026-04-05", label: "Fri Apr 4", pnl: -468 },
  { date: "2026-04-04", label: "Thu Apr 3", pnl: 1420 },
  { date: "2026-04-03", label: "Wed Apr 2", pnl: 890 },
  { date: "2026-04-02", label: "Tue Apr 1", pnl: 1640 },
];

export function ReplayScreen() {
  const { tier, setTier } = useApp();
  const canUse = gates.fullSignalDetail(tier);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBar, setCurrentBar] = useState(30);
  const [speed, setSpeed] = useState(1);
  const [selectedInstrument, setSelectedInstrument] = useState("NQ");
  const [selectedDate, setSelectedDate] = useState(REPLAY_DAY.date);
  const { data: apiReplay } = useReplay(selectedDate, selectedInstrument);

  const replayDay = useMemo<ReplayDay>(() => {
    if (!apiReplay || apiReplay.signals.length === 0) return REPLAY_DAY;
    return {
      ...REPLAY_DAY,
      date: apiReplay.date,
      instrument: apiReplay.instrument,
      signals: apiReplay.signals.map((s) => ({
        time: typeof s.timestamp === "string" ? s.timestamp.slice(11, 16) : "",
        direction: s.direction as "LONG" | "SHORT",
        grade: s.grade,
        entry: s.entry,
        result: s.status,
        pnl: s.pnl,
      })),
      totalPnl: apiReplay.signals.reduce((sum, s) => sum + s.pnl, 0),
    };
  }, [apiReplay]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentBar((prev) => {
        if (prev >= replayDay.candles.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, replayDay.candles.length]);

  const visibleCandles = replayDay.candles.slice(0, currentBar + 1);
  const visibleSignals = replayDay.signals.filter((s) => {
    const signalIdx = replayDay.candles.findIndex((c) => c.time >= s.time);
    return signalIdx <= currentBar;
  });

  const maxCandles = replayDay.candles.length;
  const progressPct = ((currentBar + 1) / maxCandles) * 100;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="label mb-1">Historical Analysis</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Replay Mode
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          DVR for past trading sessions
        </p>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {AVAILABLE_DAYS.map((d) => (
          <button
            key={d.date}
            onClick={() => { setSelectedDate(d.date); setCurrentBar(0); setIsPlaying(false); }}
            className={cn(
              "flex-shrink-0 px-3 py-2 rounded-xl border text-left transition-all min-w-[100px]",
              d.date === selectedDate
                ? "bg-amber/[0.10] border-amber/30"
                : "border-white/[0.06] hover:border-white/[0.12]"
            )}
          >
            <div className="text-[10px] font-mono font-bold text-fog">{d.label}</div>
            <div className={cn("text-xs font-mono font-bold tabular-nums", d.pnl >= 0 ? "text-bull" : "text-bear")}>
              {d.pnl >= 0 ? "+" : ""}${Math.abs(d.pnl).toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      {/* Instrument tabs */}
      <div className="flex gap-1.5">
        {["NQ", "ES", "CL", "GC"].map((s) => (
          <button
            key={s}
            onClick={() => setSelectedInstrument(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border",
              selectedInstrument === s
                ? "bg-amber/[0.10] text-amber border-amber/30"
                : "text-fog border-white/[0.06] hover:text-cream"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="relative">
        <Card padded={false}>
          <div className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg text-cream">{replayDay.instrument}</span>
                <span className="text-[10px] font-mono text-fog">5m · {replayDay.session}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-fog" />
                <span className="text-xs font-mono text-fog">{replayDay.label}</span>
              </div>
            </div>
          </div>

          {/* SVG Candlestick chart */}
          <CandlestickChart candles={visibleCandles} signals={visibleSignals} />

          {/* Progress bar */}
          <div className="px-4 py-2">
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-mono text-fog">
                Bar {currentBar + 1}/{maxCandles}
              </span>
              <span className="text-[10px] font-mono text-fog">
                {visibleCandles[visibleCandles.length - 1]?.time ?? "—"}
              </span>
            </div>
          </div>
        </Card>

        {!canUse && (
          <LockOverlay
            requiredTier="Operator"
            title="Replay Mode Locked"
            description="Operator unlocks historical session replay with candle-by-candle playback."
            onUpgrade={() => setTier("operator")}
          />
        )}
      </div>

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setCurrentBar(0)} className="p-2 rounded-lg border border-white/[0.06] text-fog hover:text-cream transition-colors">
          <Rewind className="h-4 w-4" />
        </button>
        <button onClick={() => setCurrentBar(Math.max(0, currentBar - 1))} className="p-2 rounded-lg border border-white/[0.06] text-fog hover:text-cream transition-colors">
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 rounded-xl bg-amber text-bg hover:brightness-[1.08] transition shadow-amber-glow-sm"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button onClick={() => setCurrentBar(Math.min(maxCandles - 1, currentBar + 1))} className="p-2 rounded-lg border border-white/[0.06] text-fog hover:text-cream transition-colors">
          <SkipForward className="h-4 w-4" />
        </button>
        <button onClick={() => setCurrentBar(maxCandles - 1)} className="p-2 rounded-lg border border-white/[0.06] text-fog hover:text-cream transition-colors">
          <FastForward className="h-4 w-4" />
        </button>
      </div>

      {/* Speed selector */}
      <div className="flex items-center justify-center gap-2">
        {[0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all border",
              speed === s ? "bg-amber/[0.10] text-amber border-amber/30" : "text-fog border-white/[0.06]"
            )}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Signals timeline */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber" />
          <h3 className="font-display text-lg font-medium text-cream tracking-tight">Signals on this Day</h3>
        </div>
        <div className="space-y-2">
          {replayDay.signals.map((sig, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-fog">{sig.time}</span>
                {sig.direction === "LONG" ? (
                  <TrendingUp className="h-3.5 w-3.5 text-bull" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-bear" />
                )}
                <span className="text-xs font-mono font-bold text-cream">{sig.entry}</span>
                <span className={cn(
                  "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                  sig.grade === "S++" ? "text-amber bg-amber/[0.10]" : "text-fog bg-white/[0.05]"
                )}>
                  {sig.grade}
                </span>
              </div>
              <span className={cn("font-mono font-bold text-sm tabular-nums", sig.pnl >= 0 ? "text-bull" : "text-bear")}>
                {sig.pnl >= 0 ? "+" : ""}${Math.abs(sig.pnl)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CandlestickChart({ candles, signals }: { candles: ReplayCandle[]; signals: ReplaySignal[] }) {
  if (candles.length === 0) return null;

  const width = 340;
  const height = 160;
  const pad = { top: 8, right: 8, bottom: 8, left: 40 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const allHigh = Math.max(...candles.map((c) => c.high));
  const allLow = Math.min(...candles.map((c) => c.low));
  const range = allHigh - allLow || 1;

  const barW = Math.max(2, chartW / candles.length - 1);

  const toY = (price: number) => pad.top + chartH - ((price - allLow) / range) * chartH;
  const toX = (i: number) => pad.left + (i / Math.max(1, candles.length - 1)) * chartW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={pad.left} y1={pad.top + t * chartH} x2={width - pad.right} y2={pad.top + t * chartH} stroke="rgba(255,255,255,0.04)" />
      ))}

      {/* Price labels */}
      {[0, 0.5, 1].map((t) => {
        const price = allLow + t * range;
        return (
          <text key={t} x={pad.left - 4} y={toY(price) + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize={8} fontFamily="monospace">
            {price.toFixed(0)}
          </text>
        );
      })}

      {/* Candles */}
      {candles.map((c, i) => {
        const x = toX(i);
        const isGreen = c.close >= c.open;
        const color = isGreen ? "#22C55E" : "#EF4444";
        return (
          <g key={i}>
            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth={0.8} opacity={0.6} />
            <rect
              x={x - barW / 2}
              y={toY(Math.max(c.open, c.close))}
              width={barW}
              height={Math.max(1, Math.abs(toY(c.open) - toY(c.close)))}
              fill={color}
              opacity={0.8}
              rx={0.5}
            />
          </g>
        );
      })}

      {/* Signal markers */}
      {signals.map((sig, i) => {
        const idx = candles.findIndex((c) => c.time >= sig.time);
        if (idx < 0) return null;
        const x = toX(idx);
        const y = sig.direction === "LONG" ? toY(candles[idx].low) + 8 : toY(candles[idx].high) - 8;
        const color = sig.direction === "LONG" ? "#22C55E" : "#EF4444";
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill={color} opacity={0.9} />
            <circle cx={x} cy={y} r={8} fill={color} opacity={0.15} />
          </g>
        );
      })}
    </svg>
  );
}
