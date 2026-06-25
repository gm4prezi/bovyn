import { useState } from "react";
import { Card } from "../ui/Card";
import { cn } from "../../lib/cn";
import {
  SIM_ACCOUNTS,
  SIM_EQUITY,
  SIM_TRADE_LOG,
  SIM_WEEKS,
  ACCOUNT_SIZES,
  type SimAccount,
  type SimDay,
  type SimWeek,
} from "../../data/simulatedAccounts";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Eye,
} from "lucide-react";

const TIME_RANGES = ["This Week", "This Month", "3 Months", "6 Months", "All-Time"] as const;

export function SimulatedAccountTracker() {
  const [selectedSize, setSelectedSize] = useState(50000);
  const [viewMode, setViewMode] = useState<"dollar" | "pct">("pct");
  const [timeRange, setTimeRange] = useState<typeof TIME_RANGES[number]>("This Week");

  const account = SIM_ACCOUNTS.find((a) => a.size === selectedSize)!;

  return (
    <div className="space-y-4">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface shadow-card">
        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-bull/[0.07] via-transparent to-amber/[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-bull/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-[0.14em] text-bull bg-bull/10 px-2.5 py-1 rounded-full border border-bull/25">
              <span className="h-1.5 w-1.5 rounded-full bg-bull animate-pulse" />
              LIVE — WEEK 14
            </span>
            <span className="text-[9px] font-mono font-bold tracking-[0.14em] text-amber bg-amber/10 px-2.5 py-1 rounded-full border border-amber/25">
              1.5% RISK / TRADE
            </span>
            <span className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog/60 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08]">
              SIMULATED
            </span>
          </div>

          {/* Title */}
          <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-fog/40 uppercase mb-2">
            Proof of Performance
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-cream leading-none mb-3">
            Simulated<br />Accounts
          </h2>
          <p className="text-[13px] text-fog/80 font-light leading-relaxed max-w-xs">
            4 accounts trading every signal in real time.
            No cherry-picking. No selective disclosure. Fully transparent.
          </p>

          {/* Headline stats */}
          <div className="grid grid-cols-3 gap-0 mt-6 pt-5 border-t border-white/[0.06]">
            <div className="text-center pr-4 border-r border-white/[0.06]">
              <div className="font-display text-3xl font-bold text-bull tabular-nums">+9.7%</div>
              <div className="text-[9px] font-mono font-bold tracking-[0.12em] text-fog/40 uppercase mt-1">Avg Return</div>
            </div>
            <div className="text-center px-4 border-r border-white/[0.06]">
              <div className="font-display text-3xl font-bold text-cream tabular-nums">86%</div>
              <div className="text-[9px] font-mono font-bold tracking-[0.12em] text-fog/40 uppercase mt-1">TP1 Rate</div>
            </div>
            <div className="text-center pl-4">
              <div className="font-display text-3xl font-bold text-amber tabular-nums">2.8×</div>
              <div className="text-[9px] font-mono font-bold tracking-[0.12em] text-fog/40 uppercase mt-1">Profit Factor</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transparency rules strip ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Check,       text: "Every signal taken" },
          { icon: ShieldCheck, text: "No cherry-picking" },
          { icon: Eye,         text: "Real-time updates" },
          { icon: Check,       text: "Losses shown too" },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-bull/[0.04] border border-bull/[0.12]"
          >
            <Icon className="h-3.5 w-3.5 text-bull flex-shrink-0" />
            <span className="text-[11px] font-mono font-medium text-bull/80">{text}</span>
          </div>
        ))}
      </div>

      {/* ── 4 Account cards (2×2 grid) ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {SIM_ACCOUNTS.map((acct) => {
          const active = selectedSize === acct.size;
          return (
            <button
              key={acct.size}
              onClick={() => setSelectedSize(acct.size)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all group",
                active
                  ? "border-white/[0.16] bg-surface-raised shadow-card"
                  : "border-white/[0.06] bg-surface hover:bg-surface-raised hover:border-white/[0.10]"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: acct.color, boxShadow: active ? `0 0 8px ${acct.color}66` : "none" }}
                  />
                  <span className="font-mono font-bold text-xs" style={{ color: active ? acct.color : undefined }}>
                    {acct.label}
                  </span>
                </div>
                {active && (
                  <span className="text-[8px] font-mono font-bold text-bull bg-bull/10 px-1.5 py-0.5 rounded-full border border-bull/20">
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Week profit — hero number */}
              <div className={cn(
                "font-mono font-bold text-[22px] tabular-nums leading-none mb-2.5",
                acct.weekPnl >= 0 ? "text-bull" : "text-bear"
              )}>
                {acct.weekPnl >= 0 ? "+" : ""}${acct.weekPnl.toLocaleString()}
              </div>

              {/* Footer */}
              <div className="text-[10px] font-mono font-bold text-bull">
                +{acct.totalReturn}% total
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Equity curves ── */}
      <Card padded={false}>
        <div className="p-5 pb-2">
          <div className="flex items-end justify-between">
            <div>
              <div className="label mb-0.5">All 4 Accounts</div>
              <h3 className="font-display text-xl font-medium text-cream tracking-tight">Equity Curves</h3>
              <p className="text-[11px] text-fog mt-0.5 font-light">14 weeks · Jan–Apr 2026</p>
            </div>
            <button
              onClick={() => setViewMode(viewMode === "dollar" ? "pct" : "dollar")}
              className="text-[10px] font-mono font-bold text-fog hover:text-cream transition-colors px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]"
            >
              {viewMode === "dollar" ? "$ Balance" : "% Return"}
            </button>
          </div>
        </div>
        <MultiEquityCurve data={SIM_EQUITY} selectedSize={selectedSize} viewMode={viewMode} />
        {/* Legend */}
        <div className="flex items-center justify-center gap-5 px-5 pb-5 pt-2">
          {SIM_ACCOUNTS.map((a) => (
            <button
              key={a.size}
              onClick={() => setSelectedSize(a.size)}
              className="flex items-center gap-1.5 transition-opacity"
              style={{ opacity: selectedSize === a.size ? 1 : 0.35 }}
            >
              <div className="h-2 w-2 rounded-full" style={{ background: a.color }} />
              <span className="text-[10px] font-mono font-bold text-cream">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* ── Selected account detail ── */}
      <AccountDetailCard account={account} />

      {/* ── Time range filter ── */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {TIME_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all",
              timeRange === r ? "bg-white/[0.10] text-cream" : "text-fog/60 hover:text-fog"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* ── Trade log ── */}
      <Card>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="label mb-0.5">Trade Log</div>
            <h3 className="font-display text-xl font-medium text-cream tracking-tight">
              Week {account.weekNumber}
            </h3>
            <p className="text-[11px] text-fog mt-0.5 font-light">
              {account.label} · {account.weekWins}W {account.weekLosses}L
            </p>
          </div>
          <div
            className="text-right font-mono font-bold text-lg tabular-nums"
            style={{ color: account.color }}
          >
            +${account.weekPnl.toLocaleString()}
          </div>
        </div>
        <div className="space-y-2">
          {SIM_TRADE_LOG.map((day) => (
            <DayRow key={day.date} day={day} accountColor={account.color} />
          ))}
        </div>
      </Card>

      {/* ── Weekly history ── */}
      <Card>
        <div className="label mb-0.5">History</div>
        <h3 className="font-display text-xl font-medium text-cream mb-4 tracking-tight">Past Weeks</h3>
        <div className="space-y-1.5">
          {SIM_WEEKS.map((week) => <WeekRow key={week.weekNumber} week={week} />)}
        </div>
      </Card>

      {/* ── Disclaimer (small, honest) ── */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber/[0.05] border border-amber/15">
        <AlertTriangle className="h-3.5 w-3.5 text-amber/60 flex-shrink-0 mt-px" />
        <p className="text-[10px] text-amber/60 leading-relaxed font-mono">
          SIMULATED PERFORMANCE — NOT REAL MONEY. Past results do not guarantee future returns.
        </p>
      </div>
    </div>
  );
}

/* ── Multi-line equity chart ─────────────────────────────── */
function MultiEquityCurve({
  data, selectedSize, viewMode,
}: {
  data: typeof SIM_EQUITY;
  selectedSize: number;
  viewMode: "dollar" | "pct";
}) {
  const W = 360, H = 220, pad = 20;

  const values = ACCOUNT_SIZES.map((size) =>
    data.map((pt) =>
      viewMode === "pct"
        ? ((pt.balances[size] - size) / size) * 100
        : pt.balances[size]
    )
  );

  const allV = values.flat();
  const max = Math.max(...allV);
  const min = Math.min(...allV);
  const range = max - min || 1;

  const toY = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
  const toX = (i: number) => pad + (i / (data.length - 1)) * (W - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t}
          x1={pad} y1={pad + t * (H - pad * 2)}
          x2={W - pad} y2={pad + t * (H - pad * 2)}
          stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4"
        />
      ))}
      {/* Date labels */}
      {data.filter((_, i) => i % 3 === 0).map((pt, i) => (
        <text key={i}
          x={toX(i * 3)} y={H - 4}
          textAnchor="middle" fontSize={7}
          fontFamily="monospace" fill="rgba(255,255,255,0.2)"
        >
          {pt.date}
        </text>
      ))}
      {/* Area fill for selected */}
      {ACCOUNT_SIZES.map((size, ai) => {
        if (size !== selectedSize) return null;
        const acct = SIM_ACCOUNTS[ai];
        const pts = values[ai];
        const pathD = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
        const areaD = `${pathD} L ${toX(pts.length - 1)} ${H - pad} L ${toX(0)} ${H - pad} Z`;
        return <path key={size} d={areaD} fill={acct.color} fillOpacity={0.1} />;
      })}
      {/* Lines */}
      {ACCOUNT_SIZES.map((size, ai) => {
        const acct = SIM_ACCOUNTS[ai];
        const pts = values[ai];
        const pathD = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ");
        const sel = size === selectedSize;
        return (
          <path key={size} d={pathD}
            stroke={acct.color} strokeWidth={sel ? 2.5 : 1.2}
            strokeOpacity={sel ? 1 : 0.2}
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        );
      })}
      {/* Endpoint dots */}
      {ACCOUNT_SIZES.map((size, ai) => {
        const acct = SIM_ACCOUNTS[ai];
        const pts = values[ai];
        const cx = toX(pts.length - 1);
        const cy = toY(pts[pts.length - 1]);
        const sel = size === selectedSize;
        if (!sel) return null;
        return (
          <g key={size}>
            <circle cx={cx} cy={cy} r={10} fill={acct.color} fillOpacity={0.18} />
            <circle cx={cx} cy={cy} r={4} fill={acct.color} />
          </g>
        );
      })}
      {/* Value labels for selected */}
      {ACCOUNT_SIZES.map((size, ai) => {
        if (size !== selectedSize) return null;
        const acct = SIM_ACCOUNTS[ai];
        const pts = values[ai];
        const lastVal = pts[pts.length - 1];
        const cx = toX(pts.length - 1);
        const cy = toY(lastVal);
        const label = viewMode === "pct" ? `+${lastVal.toFixed(1)}%` : `$${Math.round(lastVal / 1000)}k`;
        return (
          <text key={size}
            x={cx - 6} y={cy - 10}
            textAnchor="end" fontSize={9}
            fontFamily="monospace" fontWeight="700"
            fill={acct.color}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Account detail card ─────────────────────────────────── */
function AccountDetailCard({ account }: { account: SimAccount }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: account.color, boxShadow: `0 0 10px ${account.color}55` }}
          />
          <div>
            <div className="font-mono font-bold text-sm text-cream">{account.label} Account</div>
            <div className="text-[10px] font-mono text-fog/50">Week {account.weekNumber}</div>
          </div>
        </div>
        {account.resetCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-amber bg-amber/[0.08] border border-amber/20 px-2 py-1 rounded-lg">
            <RotateCcw className="h-3 w-3" />
            {account.resetCount} reset{account.resetCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Balance hero */}
      <div className="flex items-end gap-4 mb-5 pb-5 border-b border-white/[0.06]">
        <div>
          <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog/40 uppercase mb-1">Current Balance</div>
          <div className="font-mono font-bold text-3xl tabular-nums" style={{ color: account.color }}>
            ${account.currentBalance.toLocaleString()}
          </div>
        </div>
        <div className="pb-1">
          <div className="text-[9px] font-mono text-fog/40 mb-0.5">started</div>
          <div className="font-mono text-sm text-fog tabular-nums">${account.startingBalance.toLocaleString()}</div>
        </div>
        <div className="ml-auto pb-1 text-right">
          <div className="text-[9px] font-mono text-fog/40 mb-0.5">total return</div>
          <div className="font-mono font-bold text-xl text-bull">+{account.totalReturn}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Stat label="Week P&L"     value={`+$${account.weekPnl.toLocaleString()}`}         color="#22C55E" />
        <Stat label="Total P&L"    value={`+$${account.totalPnl.toLocaleString()}`}         color="#22C55E" />
        <Stat label="Win Rate"     value={`${account.winRate}% (${account.weekWins}W/${account.weekLosses}L)`} />
        <Stat label="Profit Factor" value={`${account.profitFactor}×`} />
        <Stat label="Avg Win"      value={`$${account.avgWin.toLocaleString()}`}            color="#22C55E" />
        <Stat label="Avg Loss"     value={`$${account.avgLoss.toLocaleString()}`}           color="#EF4444" />
        <Stat label="Max DD (week)" value={`-$${account.maxDrawdownWeek.toLocaleString()}`} color="#EF4444" />
        <Stat label="Max DD (all)"  value={`-$${account.maxDrawdownAlltime.toLocaleString()}`} color="#EF4444" />
      </div>
    </Card>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono text-fog/50 uppercase tracking-[0.1em] mb-0.5">{label}</div>
      <div className="text-[13px] font-mono font-semibold tabular-nums text-cream" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

/* ── Day row ────────────────────────────────────────────── */
function DayRow({ day, accountColor }: { day: SimDay; accountColor: string }) {
  const [open, setOpen] = useState(false);
  const positive = day.dailyPnl >= 0;

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-3.5 w-3.5 text-fog" /> : <ChevronRight className="h-3.5 w-3.5 text-fog" />}
          <span className="text-xs font-mono font-bold text-cream">{day.dayLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-fog">{day.wins}W {day.losses}L</span>
          <span className={cn("text-xs font-mono font-bold tabular-nums", positive ? "text-bull" : "text-bear")}>
            {positive ? "+" : ""}${day.dailyPnl.toLocaleString()}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/[0.04]">
          <div className="grid grid-cols-7 gap-1 px-4 py-2 text-[9px] font-mono font-bold text-fog/50 uppercase tracking-[0.1em]">
            <span>Time</span><span>Inst</span><span>Dir</span>
            <span>Grade</span><span className="text-center">Cts</span>
            <span>Result</span><span className="text-right">P&L</span>
          </div>
          {day.trades.map((t) => (
            <div key={t.id} className="grid grid-cols-7 gap-1 px-4 py-2 border-t border-white/[0.03] text-[11px] font-mono">
              <span className="text-fog">{t.time}</span>
              <span className="font-bold text-cream">{t.instrument}</span>
              <span className={t.direction === "LONG" ? "text-bull" : "text-bear"}>
                {t.direction === "LONG"
                  ? <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> L</span>
                  : <span className="flex items-center gap-0.5"><TrendingDown className="h-3 w-3" /> S</span>}
              </span>
              <span className={t.grade === "S++" ? "text-amber font-bold" : t.grade === "A+" ? "text-cream font-bold" : "text-fog"}>
                {t.grade}
              </span>
              <span className="text-center text-cream">{t.contracts}</span>
              <span className={cn("text-[10px]", t.result === "Stopped" ? "text-bear" : "text-bull")}>
                {t.result === "Stopped" ? "STP" : t.result.replace(" Hit", "")}
              </span>
              <span className={cn("text-right font-bold tabular-nums", t.pnl >= 0 ? "text-bull" : "text-bear")}>
                {t.pnl >= 0 ? "+" : ""}${Math.abs(t.pnl)}
              </span>
            </div>
          ))}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
            <span className="text-[10px] font-mono text-fog">Daily: {day.wins}W {day.losses}L</span>
            <span className={cn("text-xs font-mono font-bold tabular-nums", positive ? "text-bull" : "text-bear")}>
              {positive ? "+" : ""}${day.dailyPnl.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Week row ────────────────────────────────────────────── */
function WeekRow({ week }: { week: SimWeek }) {
  const positive = week.pnl >= 0;
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-bold text-cream">Week {week.weekNumber}</span>
        <span className="text-[10px] font-mono text-fog">{week.dateRange}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={cn("text-xs font-mono font-bold tabular-nums", positive ? "text-bull" : "text-bear")}>
          {positive ? "+" : ""}${week.pnl.toLocaleString()}
        </span>
        {week.hasReset ? (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber bg-amber/[0.08] border border-amber/20 rounded-md px-1.5 py-0.5">
            <AlertTriangle className="h-2.5 w-2.5" /> RESET
          </span>
        ) : (
          <Check className="h-3.5 w-3.5 text-bull/60" />
        )}
      </div>
    </div>
  );
}
