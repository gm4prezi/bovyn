import { useMemo } from "react";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { useRiskDashboard } from "../hooks/useRiskDashboard";
import { gates } from "../lib/tierGates";
import { cn } from "../lib/cn";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  DollarSign,
  Target,
  BarChart3,
  Zap,
} from "lucide-react";

interface AccountHealth {
  accountName: string;
  broker: string;
  balance: number;
  startingBalance: number;
  dailyPnl: number;
  weeklyPnl: number;
  drawdown: number;
  maxDrawdown: number;
  openPositions: number;
  marginUsed: number;
  marginAvailable: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

interface RiskMetric {
  label: string;
  value: string;
  tone: "bull" | "bear" | "amber" | "neutral";
  icon: React.ReactNode;
}

interface OpenPosition {
  instrument: string;
  direction: "LONG" | "SHORT";
  contracts: number;
  entry: number;
  current: number;
  unrealizedPnl: number;
  riskAmount: number;
}

const ACCOUNT: AccountHealth = {
  accountName: "Topstep $50K",
  broker: "Rithmic",
  balance: 52_340,
  startingBalance: 50_000,
  dailyPnl: 1_280,
  weeklyPnl: 3_440,
  drawdown: 760,
  maxDrawdown: 2_500,
  openPositions: 2,
  marginUsed: 8_400,
  marginAvailable: 43_940,
  riskLevel: "low",
};

const POSITIONS: OpenPosition[] = [
  { instrument: "NQ", direction: "LONG", contracts: 2, entry: 24332, current: 24368, unrealizedPnl: 720, riskAmount: 600 },
  { instrument: "CL", direction: "LONG", contracts: 3, entry: 67.40, current: 67.58, unrealizedPnl: 540, riskAmount: 450 },
];

const RISK_LEVEL_STYLES = {
  low: { bg: "bg-bull/[0.06]", border: "border-bull/20", text: "text-bull", label: "LOW RISK" },
  medium: { bg: "bg-amber/[0.06]", border: "border-amber/20", text: "text-amber", label: "MODERATE" },
  high: { bg: "bg-bear/[0.06]", border: "border-bear/20", text: "text-bear", label: "ELEVATED" },
  critical: { bg: "bg-bear/[0.10]", border: "border-bear/30", text: "text-bear", label: "CRITICAL" },
};

export function RiskDashboardScreen() {
  const { tier, setTier } = useApp();
  const canUse = gates.connectedAccounts(tier);
  const { data: apiRisk } = useRiskDashboard();

  const account = useMemo<AccountHealth>(() => {
    if (!apiRisk) return ACCOUNT;
    const level = apiRisk.risk_level === "critical" ? "critical"
      : apiRisk.risk_level === "elevated" ? "high"
      : apiRisk.consecutive_losses >= 2 ? "medium" : "low";
    return {
      ...ACCOUNT,
      balance: apiRisk.hwm - apiRisk.max_drawdown + apiRisk.cushion,
      dailyPnl: apiRisk.daily_pnl,
      drawdown: apiRisk.max_drawdown - apiRisk.cushion,
      maxDrawdown: apiRisk.max_drawdown,
      riskLevel: level,
      marginUsed: apiRisk.margin_used_pct > 0 ? apiRisk.margin_used_pct * ACCOUNT.balance / 100 : ACCOUNT.marginUsed,
      marginAvailable: ACCOUNT.balance - (apiRisk.margin_used_pct > 0 ? apiRisk.margin_used_pct * ACCOUNT.balance / 100 : ACCOUNT.marginUsed),
    };
  }, [apiRisk]);

  const positions = useMemo<OpenPosition[]>(() => {
    if (!apiRisk || apiRisk.open_positions.length === 0) return POSITIONS;
    return apiRisk.open_positions.map((p) => ({
      instrument: p.symbol,
      direction: p.direction as "LONG" | "SHORT",
      contracts: p.qty,
      entry: p.entry,
      current: p.qty !== 0 ? p.entry + (p.pnl / p.qty) : p.entry,
      unrealizedPnl: p.pnl,
      riskAmount: Math.abs(p.pnl) * 0.5,
    }));
  }, [apiRisk]);

  const riskStyle = RISK_LEVEL_STYLES[account.riskLevel];
  const drawdownPct = (account.drawdown / account.maxDrawdown) * 100;
  const marginPct = (account.marginUsed / (account.marginUsed + account.marginAvailable)) * 100;
  const returnPct = ((account.balance - account.startingBalance) / account.startingBalance * 100).toFixed(1);

  const metrics: RiskMetric[] = [
    { label: "Balance", value: `$${account.balance.toLocaleString()}`, tone: "bull", icon: <DollarSign className="h-3.5 w-3.5" /> },
    { label: "Daily P&L", value: `${account.dailyPnl >= 0 ? "+" : "-"}$${Math.abs(account.dailyPnl).toLocaleString()}`, tone: account.dailyPnl >= 0 ? "bull" : "bear", icon: account.dailyPnl >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" /> },
    { label: "Drawdown", value: `$${account.drawdown.toLocaleString()}`, tone: drawdownPct > 60 ? "bear" : "amber", icon: <TrendingDown className="h-3.5 w-3.5" /> },
    { label: "Open Risk", value: `$${positions.reduce((s, p) => s + p.riskAmount, 0).toLocaleString()}`, tone: "amber", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="label mb-1">Account Health</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Risk Dashboard
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Real-time risk monitoring · {account.broker}
        </p>
      </div>

      {/* Risk level banner */}
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", riskStyle.bg, riskStyle.border)}>
        <Shield className={cn("h-5 w-5 flex-shrink-0", riskStyle.text)} />
        <div>
          <div className={cn("text-xs font-mono font-bold tracking-wider", riskStyle.text)}>
            {riskStyle.label}
          </div>
          <div className="text-[10px] text-fog mt-0.5 font-mono">
            {account.accountName} · Drawdown {drawdownPct.toFixed(0)}% of max
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-white/[0.07] bg-surface p-4">
            <div className={cn("inline-flex h-7 w-7 rounded-lg items-center justify-center mb-2 border",
              m.tone === "bull" ? "bg-bull/10 text-bull border-bull/25" :
              m.tone === "bear" ? "bg-bear/10 text-bear border-bear/25" :
              m.tone === "amber" ? "bg-amber/[0.1] text-amber border-amber/25" :
              "bg-white/[0.05] text-cream/70 border-white/[0.1]"
            )}>
              {m.icon}
            </div>
            <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog uppercase">{m.label}</div>
            <div className={cn("font-mono font-bold text-lg tabular-nums",
              m.tone === "bull" ? "text-bull" : m.tone === "bear" ? "text-bear" : m.tone === "amber" ? "text-amber" : "text-cream"
            )}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Drawdown gauge */}
      <div className="relative">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="label mb-0.5">Account Protection</div>
              <h3 className="font-display text-xl font-medium text-cream tracking-tight">Drawdown Monitor</h3>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-xl text-cream tabular-nums">${account.drawdown.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-fog">of ${account.maxDrawdown.toLocaleString()} max</div>
            </div>
          </div>
          <div className="h-4 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all relative",
                drawdownPct > 75 ? "bg-bear" : drawdownPct > 50 ? "bg-amber" : "bg-bull"
              )}
              style={{ width: `${drawdownPct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-mono text-fog">0%</span>
            <span className="text-[10px] font-mono text-fog">{drawdownPct.toFixed(0)}% used</span>
            <span className="text-[10px] font-mono text-bear">100% = RESET</span>
          </div>
        </Card>

        {/* Margin usage */}
        <Card className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-medium text-cream tracking-tight">Margin Usage</h3>
            <span className="text-xs font-mono font-bold text-cream tabular-nums">{marginPct.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-amber rounded-full" style={{ width: `${marginPct}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-[10px] font-mono text-fog uppercase tracking-wider">Used</div>
              <div className="text-sm font-mono font-bold text-cream tabular-nums">${account.marginUsed.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-fog uppercase tracking-wider">Available</div>
              <div className="text-sm font-mono font-bold text-bull tabular-nums">${account.marginAvailable.toLocaleString()}</div>
            </div>
          </div>
        </Card>

        {!canUse && (
          <LockOverlay
            requiredTier="Execute"
            title="Risk Dashboard Locked"
            description="Execute tier unlocks real-time risk monitoring for connected accounts."
            onUpgrade={() => setTier("execute")}
          />
        )}
      </div>

      {/* Open positions */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-amber" />
          <h3 className="font-display text-lg font-medium text-cream tracking-tight">
            Open Positions ({positions.length})
          </h3>
        </div>
        <div className="space-y-2">
          {positions.map((pos) => (
            <div key={pos.instrument} className="flex items-center justify-between px-3 py-3 rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-3">
                {pos.direction === "LONG" ? (
                  <TrendingUp className="h-4 w-4 text-bull" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-bear" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-cream">{pos.instrument}</span>
                    <span className={cn("text-[10px] font-mono font-bold", pos.direction === "LONG" ? "text-bull" : "text-bear")}>
                      {pos.direction}
                    </span>
                    <span className="text-[10px] font-mono text-fog">{pos.contracts} ct</span>
                  </div>
                  <div className="text-[10px] font-mono text-fog mt-0.5">
                    Entry: {pos.entry} · Current: {pos.current}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("font-mono font-bold text-sm tabular-nums", pos.unrealizedPnl >= 0 ? "text-bull" : "text-bear")}>
                  {pos.unrealizedPnl >= 0 ? "+" : ""}${Math.abs(pos.unrealizedPnl).toLocaleString()}
                </div>
                <div className="text-[10px] font-mono text-fog">Risk: ${pos.riskAmount}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Account summary */}
      <Card>
        <h3 className="font-display text-lg font-medium text-cream mb-3 tracking-tight">Account Summary</h3>
        <div className="space-y-2">
          <SummaryRow label="Starting Balance" value={`$${account.startingBalance.toLocaleString()}`} />
          <SummaryRow label="Current Balance" value={`$${account.balance.toLocaleString()}`} tone="bull" />
          <SummaryRow label="Total Return" value={`+${returnPct}%`} tone="bull" />
          <SummaryRow label="Weekly P&L" value={`+$${account.weeklyPnl.toLocaleString()}`} tone="bull" />
          <SummaryRow label="Max Drawdown Limit" value={`$${account.maxDrawdown.toLocaleString()}`} tone="bear" />
        </div>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-fog">{label}</span>
      <span className={cn("text-xs font-mono font-bold tabular-nums", tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-cream")}>
        {value}
      </span>
    </div>
  );
}
