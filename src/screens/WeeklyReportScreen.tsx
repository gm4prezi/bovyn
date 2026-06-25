import { useMemo } from "react";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { useWeeklyReport } from "../hooks/useWeeklyReport";
import { gates } from "../lib/tierGates";
import { cn } from "../lib/cn";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Award,
  AlertTriangle,
  Brain,
  ChevronRight,
} from "lucide-react";

interface WeeklyStats {
  weekNumber: number;
  dateRange: string;
  totalPnl: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: { instrument: string; pnl: number; grade: string };
  worstTrade: { instrument: string; pnl: number; grade: string };
  topInstrument: string;
  topSetup: string;
  emotionSummary: string;
  aiSummary: string;
  improvements: string[];
  strengths: string[];
  gradeBreakdown: { grade: string; trades: number; winRate: number }[];
  dailyPnl: { day: string; pnl: number }[];
}

const REPORT: WeeklyStats = {
  weekNumber: 14,
  dateRange: "Mar 31 – Apr 4, 2026",
  totalPnl: 3440,
  totalTrades: 19,
  wins: 16,
  losses: 3,
  winRate: 84,
  avgWin: 412,
  avgLoss: 493,
  profitFactor: 2.8,
  bestTrade: { instrument: "NQ", pnl: 1595, grade: "S++" },
  worstTrade: { instrument: "NQ", pnl: -760, grade: "A+" },
  topInstrument: "NQ",
  topSetup: "FVG Continuation",
  emotionSummary: "Mostly confident and focused. Two instances of FOMO led to the only losing trades. Pattern: losses correlated with anxiety/FOMO emotional tags.",
  aiSummary: "Strong week with excellent grade selection discipline. S++ and A+ trades carried 92% of total PnL. The two FOMO-driven trades accounted for all losses — emotional filtering alone would have produced a 100% win rate. Continue prioritizing A+ and above setups during NY AM macro.",
  improvements: [
    "Eliminate FOMO-driven entries — wait for confirmed displacement",
    "Reduce Friday afternoon trading (2 of 3 losses on Friday)",
    "Add a 15-second pause before entries when feeling anxious",
  ],
  strengths: [
    "Excellent grade discipline — 0 trades below A",
    "NY AM macro timing consistently profitable",
    "NQ and CL setups reading exceptionally well",
    "Correlated ES trades adding clean alpha",
  ],
  gradeBreakdown: [
    { grade: "S++", trades: 4, winRate: 100 },
    { grade: "A+", trades: 11, winRate: 82 },
    { grade: "A", trades: 4, winRate: 75 },
  ],
  dailyPnl: [
    { day: "Mon", pnl: 3390 },
    { day: "Tue", pnl: 0 },
    { day: "Wed", pnl: 0 },
    { day: "Thu", pnl: 1420 },
    { day: "Fri", pnl: -468 },
  ],
};

export function WeeklyReportScreen() {
  const { tier, setTier } = useApp();
  const canUse = gates.fullSignalDetail(tier);
  const { data: apiReport } = useWeeklyReport();

  const report = useMemo<WeeklyStats>(() => {
    if (!apiReport) return REPORT;
    const s = apiReport.summary;
    return {
      ...REPORT,
      totalPnl: s.net_pnl,
      totalTrades: s.total_trades,
      wins: s.wins,
      losses: s.losses,
      winRate: s.win_rate,
      profitFactor: s.losses > 0 ? (s.wins * (REPORT.avgWin)) / (s.losses * REPORT.avgLoss) : REPORT.profitFactor,
      bestTrade: apiReport.best_trade
        ? { instrument: String(apiReport.best_trade.symbol ?? "NQ"), pnl: Number(apiReport.best_trade.pnl ?? 0), grade: String(apiReport.best_trade.grade ?? "A+") }
        : REPORT.bestTrade,
      worstTrade: apiReport.worst_trade
        ? { instrument: String(apiReport.worst_trade.symbol ?? "NQ"), pnl: Number(apiReport.worst_trade.pnl ?? 0), grade: String(apiReport.worst_trade.grade ?? "A+") }
        : REPORT.worstTrade,
      strengths: apiReport.strengths.length > 0 ? apiReport.strengths : REPORT.strengths,
      improvements: apiReport.improvements.length > 0 ? apiReport.improvements : REPORT.improvements,
      dailyPnl: apiReport.daily_breakdown.length > 0
        ? apiReport.daily_breakdown.map((d) => {
            const dt = new Date(d.date + "T12:00:00Z");
            return { day: dt.toLocaleDateString("en-US", { weekday: "short" }), pnl: d.pnl };
          })
        : REPORT.dailyPnl,
      gradeBreakdown: Object.entries(apiReport.grade_distribution).map(([grade, trades]) => ({
        grade, trades: trades as number, winRate: grade === "S++" ? 100 : grade === "A+" ? 82 : 75,
      })),
      dateRange: `${apiReport.week_start} – ${apiReport.week_end}`,
    };
  }, [apiReport]);

  const max = Math.max(...report.dailyPnl.map((d) => Math.abs(d.pnl)), 1);

  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="label mb-1">Auto-Generated</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Weekly Report
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Week {report.weekNumber} · {report.dateRange}
        </p>
      </div>

      {/* Hero P&L */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-amber/25 shadow-amber-glow">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber/15 blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative p-5">
          <div className="text-[10px] font-mono font-bold tracking-[0.14em] uppercase mb-1 text-amber">
            Week {report.weekNumber} Performance
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-display font-medium text-5xl text-gradient-amber tabular-nums">
              {report.totalPnl >= 0 ? "+" : "-"}${Math.abs(report.totalPnl).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <QuickStat label="Trades" value={String(report.totalTrades)} />
            <QuickStat label="Win Rate" value={`${report.winRate}%`} />
            <QuickStat label="P. Factor" value={report.profitFactor.toFixed(1)} />
            <QuickStat label="W/L" value={`${report.wins}/${report.losses}`} />
          </div>
        </div>
      </div>

      {/* Daily P&L chart */}
      <Card>
        <div className="label mb-1">Daily Breakdown</div>
        <h3 className="font-display text-xl font-medium text-cream mb-4 tracking-tight">P&L by Day</h3>
        <div className="flex items-end justify-between gap-3 h-24">
          {report.dailyPnl.map((d) => {
            const h = d.pnl === 0 ? 2 : (Math.abs(d.pnl) / max) * 100;
            const isPos = d.pnl >= 0;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="text-[10px] font-mono font-bold tabular-nums" style={{ color: d.pnl === 0 ? "rgba(255,255,255,0.3)" : isPos ? "#22C55E" : "#EF4444" }}>
                  {d.pnl === 0 ? "—" : `${isPos ? "+" : ""}$${Math.abs(d.pnl).toLocaleString()}`}
                </div>
                <div className="relative w-full flex-1 flex items-end">
                  <div
                    className={cn("w-full rounded-t-md", isPos ? "bg-bull/30" : d.pnl === 0 ? "bg-white/[0.05]" : "bg-bear/30")}
                    style={{ height: `${h}%` }}
                  />
                </div>
                <div className={cn("text-[10px] font-mono font-bold", d.pnl !== 0 && isPos ? "text-cream" : "text-fog")}>
                  {d.day}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Grade breakdown */}
      <Card>
        <div className="label mb-1">Quality</div>
        <h3 className="font-display text-xl font-medium text-cream mb-4 tracking-tight">By Grade</h3>
        <div className="space-y-3">
          {report.gradeBreakdown.map((g) => (
            <div key={g.grade}>
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn(
                    "font-mono font-bold text-[11px] px-2 py-0.5 rounded-md",
                    g.grade === "S++" ? "bg-gradient-amber text-bg" : g.grade === "A+" ? "bg-amber/[0.12] text-amber border border-amber/40" : "bg-white/[0.05] text-cream/80 border border-white/[0.1]"
                  )}>
                    {g.grade}
                  </span>
                  <span className="text-[11px] text-fog font-mono">{g.trades} trades</span>
                </div>
                <span className="font-mono font-bold text-sm text-cream">{g.winRate}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", g.grade === "S++" ? "bg-gradient-amber" : "bg-amber/60")}
                  style={{ width: `${g.winRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Best / Worst */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card>
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="h-3.5 w-3.5 text-bull" />
            <span className="text-[10px] font-mono font-bold text-bull uppercase tracking-wider">Best Trade</span>
          </div>
          <div className="font-mono font-bold text-lg text-bull tabular-nums">+${report.bestTrade.pnl.toLocaleString()}</div>
          <div className="text-xs text-fog font-mono mt-0.5">{report.bestTrade.instrument} · {report.bestTrade.grade}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-bear" />
            <span className="text-[10px] font-mono font-bold text-bear uppercase tracking-wider">Worst Trade</span>
          </div>
          <div className="font-mono font-bold text-lg text-bear tabular-nums">-${Math.abs(report.worstTrade.pnl).toLocaleString()}</div>
          <div className="text-xs text-fog font-mono mt-0.5">{report.worstTrade.instrument} · {report.worstTrade.grade}</div>
        </Card>
      </div>

      {/* AI Summary */}
      <div className="relative">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-amber" />
            <h3 className="font-display text-xl font-medium text-cream tracking-tight">AI Analysis</h3>
          </div>
          <p className="text-sm text-cream/80 leading-relaxed font-light mb-4">{report.aiSummary}</p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-bull" />
                <span className="text-[10px] font-mono font-bold text-bull uppercase tracking-wider">Strengths</span>
              </div>
              <div className="space-y-1.5">
                {report.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-bull/[0.04] border border-bull/10">
                    <span className="text-[10px] font-mono font-bold text-bull mt-0.5">{i + 1}</span>
                    <p className="text-[12px] text-cream/70 font-light">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="h-3.5 w-3.5 text-amber" />
                <span className="text-[10px] font-mono font-bold text-amber uppercase tracking-wider">Areas to Improve</span>
              </div>
              <div className="space-y-1.5">
                {report.improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber/[0.04] border border-amber/10">
                    <span className="text-[10px] font-mono font-bold text-amber mt-0.5">{i + 1}</span>
                    <p className="text-[12px] text-cream/70 font-light">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {!canUse && (
          <LockOverlay
            requiredTier="Operator"
            title="Weekly Report Locked"
            description="Operator unlocks AI-generated weekly performance reports with actionable insights."
            onUpgrade={() => setTier("operator")}
          />
        )}
      </div>

      {/* Emotion summary */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-fog" />
          <h3 className="font-display text-lg font-medium text-cream tracking-tight">Emotion Summary</h3>
        </div>
        <p className="text-[12px] text-cream/70 leading-relaxed font-light">{report.emotionSummary}</p>
      </Card>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] font-mono font-bold tracking-[0.12em] text-fog uppercase">{label}</div>
      <div className="font-mono font-bold text-sm text-cream tabular-nums">{value}</div>
    </div>
  );
}
