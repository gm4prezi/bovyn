import { useState, useEffect, useCallback } from "react";
import {
  fetchPublicTrackRecord,
  type TrackRecordResponse,
  type TrackRecordEquityPoint,
  type TrackRecordMonthly,
  type TrackRecordInstrument,
} from "../lib/bovynApi";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/cn";
import {
  TrendingUp,
  Target,
  BarChart3,
  Activity,
  ArrowDown,
  Calendar,
  Loader2,
  Flame,
  Snowflake,
  RefreshCw,
} from "lucide-react";

// ── Equity Curve SVG ──────────────────────────────────────────

function EquityCurve({ points }: { points: TrackRecordEquityPoint[] }) {
  if (points.length < 2) return null;

  const W = 600;
  const H = 200;
  const PAD_X = 0;
  const PAD_Y = 16;

  const values = points.map((p) => p.cumulative_pnl);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const xStep = (W - PAD_X * 2) / (points.length - 1);

  const toY = (v: number) =>
    PAD_Y + (1 - (v - minVal) / range) * (H - PAD_Y * 2);

  const pathPoints = points.map(
    (p, i) => `${PAD_X + i * xStep},${toY(p.cumulative_pnl)}`
  );
  const linePath = `M${pathPoints.join(" L")}`;
  const areaPath = `${linePath} L${PAD_X + (points.length - 1) * xStep},${H} L${PAD_X},${H} Z`;

  const lastVal = values[values.length - 1];
  const positive = lastVal >= 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={positive ? "#34d399" : "#f87171"}
            stopOpacity="0.25"
          />
          <stop
            offset="100%"
            stopColor={positive ? "#34d399" : "#f87171"}
            stopOpacity="0"
          />
        </linearGradient>
        <linearGradient id="equity-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop
            offset="0%"
            stopColor={positive ? "#34d399" : "#f87171"}
            stopOpacity="0.6"
          />
          <stop
            offset="100%"
            stopColor={positive ? "#34d399" : "#f87171"}
            stopOpacity="1"
          />
        </linearGradient>
      </defs>
      {/* Zero line */}
      {minVal < 0 && (
        <line
          x1={PAD_X}
          y1={toY(0)}
          x2={W - PAD_X}
          y2={toY(0)}
          stroke="rgba(255,255,255,0.08)"
          strokeDasharray="4 4"
        />
      )}
      <path d={areaPath} fill="url(#equity-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="url(#equity-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={PAD_X + (points.length - 1) * xStep}
        cy={toY(lastVal)}
        r="4"
        fill={positive ? "#34d399" : "#f87171"}
      />
    </svg>
  );
}

// ── Hero Stat Card ────────────────────────────────────────────

function HeroStat({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "bull" | "bear" | "amber" | "neutral";
}) {
  const toneMap = {
    bull: "text-emerald-400",
    bear: "text-red-400",
    amber: "text-amber",
    neutral: "text-cream",
  };
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className={cn("opacity-60", toneMap[tone])}>{icon}</div>
      <div
        className={cn(
          "font-mono font-bold text-xl tabular-nums leading-none",
          toneMap[tone]
        )}
      >
        {value}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">
        {label}
      </div>
    </div>
  );
}

// ── Monthly Row ───────────────────────────────────────────────

function MonthlyRow({ m }: { m: TrackRecordMonthly }) {
  const positive = m.pnl >= 0;
  return (
    <div className="grid grid-cols-4 items-center py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="text-xs font-mono text-cream">{m.month}</div>
      <div
        className={cn(
          "text-xs font-mono font-bold tabular-nums text-right",
          positive ? "text-emerald-400" : "text-red-400"
        )}
      >
        {positive ? "+" : ""}
        {m.pnl >= 1000 || m.pnl <= -1000
          ? `$${(m.pnl / 1000).toFixed(1)}k`
          : `$${m.pnl.toFixed(0)}`}
      </div>
      <div className="text-xs font-mono text-fog text-right tabular-nums">
        {m.trades}
      </div>
      <div
        className={cn(
          "text-xs font-mono font-bold text-right tabular-nums",
          m.win_rate >= 60 ? "text-emerald-400" : m.win_rate >= 50 ? "text-amber" : "text-red-400"
        )}
      >
        {m.win_rate.toFixed(0)}%
      </div>
    </div>
  );
}

// ── Instrument Card ───────────────────────────────────────────

function InstrumentCard({ inst }: { inst: TrackRecordInstrument }) {
  const positive = inst.pnl >= 0;
  return (
    <Card className="!p-4" hover>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-sm text-cream tracking-tight">
          {inst.symbol}
        </span>
        <Badge variant={positive ? "bull" : "bear"} size="xs">
          {positive ? "+" : ""}
          {inst.pnl >= 1000 || inst.pnl <= -1000
            ? `$${(inst.pnl / 1000).toFixed(1)}k`
            : `$${inst.pnl.toFixed(0)}`}
        </Badge>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] font-mono text-fog uppercase tracking-[0.08em]">
          Win Rate
        </div>
        <div
          className={cn(
            "font-mono font-bold text-lg tabular-nums",
            inst.win_rate >= 60 ? "text-emerald-400" : inst.win_rate >= 50 ? "text-amber" : "text-red-400"
          )}
        >
          {inst.win_rate.toFixed(0)}%
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <div className="text-[10px] font-mono text-fog uppercase tracking-[0.08em]">
          Signals
        </div>
        <div className="font-mono text-sm tabular-nums text-cream/80">
          {inst.signals}
        </div>
      </div>
    </Card>
  );
}

// ── Format helpers ────────────────────────────────────────────

function fmtPnl(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `${v >= 0 ? "+" : ""}$${(v / 1000).toFixed(1)}k`;
  return `${v >= 0 ? "+" : ""}$${v.toFixed(0)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Main Screen ───────────────────────────────────────────────

export function TrackRecordScreen() {
  const [data, setData] = useState<TrackRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchPublicTrackRecord();
      setData(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load track record");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4 pb-4">
        <div>
          <div className="label mb-1">Public</div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
            Track Record
          </h1>
        </div>
        <Card>
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-fog/40 mx-auto mb-3" />
            <p className="text-sm text-bear">Failed to load track record</p>
            <p className="text-[11px] text-fog mt-1">{error}</p>
            <button
              onClick={load}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber hover:text-amber/80 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const pnlPositive = data.net_pnl >= 0;
  const streakWin = data.current_streak.type === "win";

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="label mb-1">Verified Performance</div>
          <Badge variant="bull" size="xs">LIVE</Badge>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-amber/50" />}
        </div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Track Record
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          {data.total_trades} verified signals &middot; {data.days_trading} days live
        </p>
      </div>

      {/* Streak Badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-xl border",
            streakWin
              ? "bg-emerald-400/[0.08] text-emerald-400 border-emerald-400/25"
              : "bg-red-400/[0.08] text-red-400 border-red-400/25"
          )}
        >
          {streakWin ? (
            <Flame className="h-4 w-4" />
          ) : (
            <Snowflake className="h-4 w-4" />
          )}
          {data.current_streak.count}
          {streakWin ? "W" : "L"} streak
        </span>
      </div>

      {/* Hero Stats */}
      <Card tone="raised" className="!p-4">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          <HeroStat
            label="Net P&L"
            value={fmtPnl(data.net_pnl)}
            icon={<TrendingUp className="h-4 w-4" />}
            tone={pnlPositive ? "bull" : "bear"}
          />
          <HeroStat
            label="Win Rate"
            value={`${data.win_rate.toFixed(1)}%`}
            icon={<Target className="h-4 w-4" />}
            tone="amber"
          />
          <HeroStat
            label="P. Factor"
            value={data.profit_factor.toFixed(2)}
            icon={<BarChart3 className="h-4 w-4" />}
            tone="neutral"
          />
          <HeroStat
            label="Trades"
            value={String(data.total_trades)}
            icon={<Activity className="h-4 w-4" />}
            tone="neutral"
          />
          <HeroStat
            label="Max DD"
            value={fmtPnl(-Math.abs(data.max_drawdown))}
            icon={<ArrowDown className="h-4 w-4" />}
            tone="bear"
          />
          <HeroStat
            label="Days"
            value={String(data.days_trading)}
            icon={<Calendar className="h-4 w-4" />}
            tone="neutral"
          />
        </div>
      </Card>

      {/* Equity Curve */}
      {data.equity_curve.length >= 2 && (
        <Card>
          <div className="label mb-3">Cumulative P&L</div>
          <div className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.04] p-3">
            <EquityCurve points={data.equity_curve} />
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] font-mono text-fog">
              {data.equity_curve[0]?.date}
            </span>
            <span className="text-[10px] font-mono text-fog">
              {data.equity_curve[data.equity_curve.length - 1]?.date}
            </span>
          </div>
        </Card>
      )}

      {/* Monthly Breakdown */}
      {data.monthly.length > 0 && (
        <Card>
          <div className="label mb-3">Monthly Breakdown</div>
          <div className="grid grid-cols-4 items-center pb-2 border-b border-white/[0.08]">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">Month</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog text-right">P&L</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog text-right">Trades</div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog text-right">Win %</div>
          </div>
          {data.monthly.map((m) => (
            <MonthlyRow key={m.month} m={m} />
          ))}
        </Card>
      )}

      {/* By Instrument */}
      {data.by_instrument.length > 0 && (
        <div>
          <div className="label mb-3">By Instrument</div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {data.by_instrument.map((inst) => (
              <InstrumentCard key={inst.symbol} inst={inst} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 text-center space-y-1">
        <p className="text-[10px] font-mono text-fog/60">
          Last updated: {timeAgo(data.last_updated)}
        </p>
        <p className="text-[10px] font-mono text-fog/40">
          Data from live signal database. Independently verifiable.
        </p>
      </div>
    </div>
  );
}
