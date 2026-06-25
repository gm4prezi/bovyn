import { useState, useEffect, useCallback } from "react";
import {
  PERFORMANCE_SUMMARY,
  WIN_RATE_BY_INSTRUMENT,
  MONTHLY_PNL,
  WIN_RATE_BY_GRADE,
} from "../data/performance";
import { fetchStats, type StatsResponse, type StatsMonthly } from "../lib/bovynApi";
import { Card } from "../components/ui/Card";
import { useApp } from "../context/AppContext";
import { TrendingUp, Target, BarChart3, Loader2 } from "lucide-react";
import { cn } from "../lib/cn";
import { SimulatedAccountTracker } from "../components/stats/SimulatedAccountTracker";

export function StatsScreen() {
  const { tier } = useApp();

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStats();
      setStats(data);
    } catch {
      /* fallback to mock */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Use real data if available, mock as fallback
  const netPnl = stats?.net_pnl ?? PERFORMANCE_SUMMARY.netPnl;
  const winRate = stats?.win_rate ?? PERFORMANCE_SUMMARY.winRate;
  const profitFactor = stats?.profit_factor ?? PERFORMANCE_SUMMARY.profitFactor;
  const totalTrades = stats?.total_trades ?? 0;
  const byInstrument = stats?.by_instrument ?? WIN_RATE_BY_INSTRUMENT;
  const byGrade = stats?.by_grade ?? WIN_RATE_BY_GRADE;
  const monthly = stats?.monthly ?? MONTHLY_PNL;
  const isReal = stats !== null;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="label mb-1">Track Record</div>
          {isReal && (
            <span className="text-[9px] font-mono text-bull bg-bull/10 px-1.5 py-0.5 rounded border border-bull/20">LIVE</span>
          )}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-amber/50" />}
        </div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Performance
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          {totalTrades} resolved signals · {isReal ? "Real engine data" : "Last 30 days"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          label="Net P&L"
          value={`$${Math.abs(netPnl) >= 1000 ? `${(netPnl / 1000).toFixed(1)}k` : netPnl.toFixed(0)}`}
          tone={netPnl >= 0 ? "bull" : "neutral"}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          tone="amber"
          icon={<Target className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="P. Factor"
          value={profitFactor.toFixed(2)}
          tone="neutral"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Win Rate by Grade — "Consensus Gate" highlight */}
      <Card className="border-amber/[0.14] bg-amber/[0.02]">
        <div className="flex items-center gap-2 mb-1">
          <div className="label">Consensus Gate</div>
          <span className="text-[8px] font-mono font-bold text-amber bg-amber/10 px-1.5 py-0.5 rounded border border-amber/20">KEY METRIC</span>
        </div>
        <h3 className="font-display text-xl font-medium text-cream mb-4 tracking-tight">
          Win Rate by Grade
        </h3>
        <div className="space-y-3">
          {byGrade.map((row) => (
            <GradeRow key={row.grade} {...row} />
          ))}
        </div>
      </Card>

      {/* ── Simulated Account Tracker ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-fog/30 uppercase">
            Proof of Performance
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
        <SimulatedAccountTracker />
      </div>

      {/* TP1 Rate by Instrument */}
      <Card>
        <div className="label mb-1">Confirmed Gate · 86% TP1</div>
        <h3 className="font-display text-xl font-medium text-cream mb-1 tracking-tight">
          TP1 Rate by Instrument
        </h3>
        <p className="text-[11px] text-fog mb-4 font-light">
          Confirmed consensus gate (score ≥ 6)
        </p>
        <div className="space-y-2.5">
          {byInstrument.map((row) => (
            <InstrumentBar key={row.symbol} {...row} />
          ))}
        </div>
      </Card>

      {/* Monthly P&L */}
      <Card>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="label mb-0.5">Recent</div>
            <h3 className="font-display text-xl font-medium text-cream tracking-tight">Monthly P&L</h3>
            <p className="text-[11px] text-fog mt-0.5 font-light">{monthly.length} months</p>
          </div>
        </div>
        <MonthlyPnlChart data={monthly} />
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "bull" | "amber" | "neutral";
  icon: React.ReactNode;
}) {
  const iconBg = {
    bull: "bg-bull/10 text-bull border-bull/25",
    amber: "bg-amber/[0.1] text-amber border-amber/25",
    neutral: "bg-white/[0.05] text-cream/70 border-white/[0.1]",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-surface p-4 shadow-card">
      <div className={cn("inline-flex h-7 w-7 rounded-lg items-center justify-center mb-2 border", iconBg[tone])}>
        {icon}
      </div>
      <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog uppercase">
        {label}
      </div>
      <div className="font-mono font-bold text-lg text-cream tabular-nums">{value}</div>
    </div>
  );
}

function InstrumentBar({
  symbol,
  winRate,
  signals,
  pnl,
}: {
  symbol: string;
  winRate: number;
  signals: number;
  pnl: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono font-bold text-sm text-cream">{symbol}</span>
          <span className="text-[10px] font-mono text-fog">{signals} signals</span>
        </div>
        <div className="flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-xs font-bold text-bull">+${pnl.toLocaleString()}</span>
          <span className="text-xs font-bold text-cream">{winRate}%</span>
        </div>
      </div>
      <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-amber rounded-full relative shadow-amber-glow-sm"
          style={{ width: `${winRate}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}

function GradeRow({
  grade,
  winRate,
  signals,
}: {
  grade: string;
  winRate: number;
  signals: number;
}) {
  const style =
    grade === "S++"
      ? { bar: "bg-gradient-amber shadow-amber-glow-sm", chip: "bg-gradient-amber text-bg" }
      : grade === "A+"
      ? { bar: "bg-amber/80", chip: "bg-amber/[0.12] text-amber border border-amber/40" }
      : { bar: "bg-white/20", chip: "bg-white/[0.05] text-cream/80 border border-white/[0.1]" };
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono font-bold text-[11px] px-2 py-0.5 rounded-md",
              style.chip
            )}
          >
            {grade}
          </span>
          <span className="text-[11px] text-fog font-mono">{signals} signals</span>
        </div>
        <span className="font-mono font-bold text-sm text-cream">{winRate}%</span>
      </div>
      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", style.bar)}
          style={{ width: `${winRate}%` }}
        />
      </div>
    </div>
  );
}

function MonthlyPnlChart({ data }: { data: StatsMonthly[] }) {
  const pts = data.length > 0 ? data : MONTHLY_PNL;
  const max = Math.max(...pts.map((m) => Math.abs(m.pnl)), 1);
  return (
    <div className="flex items-end justify-between gap-3 h-32">
      {pts.map((m, i) => {
        const h = (Math.abs(m.pnl) / max) * 100;
        const isLast = i === pts.length - 1;
        const isNeg = m.pnl < 0;
        return (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full flex-1 flex items-end">
              <div
                className={cn(
                  "w-full rounded-t-md relative",
                  isNeg ? "bg-bear/60" : isLast ? "bg-gradient-amber shadow-amber-glow-sm" : "bg-white/10"
                )}
                style={{ height: `${h}%` }}
              >
                {isLast && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-amber">
                    ${(m.pnl / 1000).toFixed(0)}k
                  </div>
                )}
              </div>
            </div>
            <div className={cn("text-[10px] font-mono font-bold tracking-[0.08em]", isLast ? "text-amber" : "text-fog")}>
              {m.month}
            </div>
          </div>
        );
      })}
    </div>
  );
}
