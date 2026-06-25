import { useState, useEffect, useCallback } from "react";
import {
  fetchAdminAnalytics,
  fetchChurnRisk,
  sendWinback,
  type AdminAnalyticsResponse,
  type ChurnRiskResponse,
  type ChurnRiskUser,
} from "../lib/bovynApi";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/cn";
import {
  Users,
  Activity,
  DollarSign,
  TrendingDown,
  Clock,
  Shield,
  Loader2,
  Send,
  AlertTriangle,
  UserPlus,
} from "lucide-react";

// ── Tier Colors ───────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  trial: "bg-white/[0.15]",
  intel: "bg-teal-500/70",
  operator: "bg-amber/70",
  execute: "bg-blue-400/70",
  architect: "bg-purple-400/70",
};

const TIER_TEXT_COLORS: Record<string, string> = {
  trial: "text-fog",
  intel: "text-teal-400",
  operator: "text-amber",
  execute: "text-blue-400",
  architect: "text-purple-400",
};

// ── KPI Card ──────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  format = "number",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  format?: "number" | "currency" | "percent";
}) {
  let display: string;
  if (format === "currency") {
    display = value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value.toFixed(0)}`;
  } else if (format === "percent") {
    display = `${value.toFixed(1)}%`;
  } else {
    display = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  }

  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className="text-fog/60">{icon}</div>
      <div className="font-mono font-bold text-xl tabular-nums text-cream leading-none">
        {display}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">
        {label}
      </div>
    </div>
  );
}

// ── Tier Distribution Bar ─────────────────────────────────────

function TierDistribution({
  data,
}: {
  data: AdminAnalyticsResponse["tier_distribution"];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <Card>
      <div className="label mb-3">Tier Distribution</div>
      {/* Stacked bar */}
      <div className="flex h-8 rounded-lg overflow-hidden border border-white/[0.06]">
        {data.map((d) => (
          <div
            key={d.tier}
            className={cn("transition-all", TIER_COLORS[d.tier] ?? "bg-white/[0.1]")}
            style={{ width: `${(d.count / total) * 100}%` }}
            title={`${d.tier}: ${d.count}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {data.map((d) => (
          <div key={d.tier} className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-sm",
                TIER_COLORS[d.tier] ?? "bg-white/[0.1]"
              )}
            />
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-fog">
              {d.tier}
            </span>
            <span
              className={cn(
                "font-mono font-bold text-xs tabular-nums",
                TIER_TEXT_COLORS[d.tier] ?? "text-cream"
              )}
            >
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Signup Bar Chart (inline SVG) ─────────────────────────────

function SignupChart({
  data,
}: {
  data: AdminAnalyticsResponse["monthly_signups"];
}) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const W = 600;
  const H = 160;
  const barGap = 4;
  const barW = Math.max(
    8,
    (W - barGap * (data.length - 1)) / data.length
  );

  return (
    <Card>
      <div className="label mb-3">Monthly Signups</div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full h-auto">
        {data.map((d, i) => {
          const barH = (d.count / maxCount) * H;
          const x = i * (barW + barGap);
          return (
            <g key={d.month}>
              <rect
                x={x}
                y={H - barH}
                width={barW}
                height={barH}
                rx={4}
                fill="rgba(240,160,32,0.6)"
              />
              <text
                x={x + barW / 2}
                y={H - barH - 6}
                textAnchor="middle"
                className="fill-cream/60 text-[10px] font-mono"
                fontSize="10"
              >
                {d.count}
              </text>
              <text
                x={x + barW / 2}
                y={H + 16}
                textAnchor="middle"
                className="fill-fog text-[8px] font-mono"
                fontSize="8"
              >
                {d.month.slice(-3)}
              </text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}

// ── Churn Risk Row ────────────────────────────────────────────

function ChurnRow({
  user,
  onWinback,
  sending,
}: {
  user: ChurnRiskUser;
  onWinback: (userId: string) => void;
  sending: boolean;
}) {
  const riskBadge: Record<string, { variant: "bull" | "amber" | "bear"; label: string }> = {
    low: { variant: "bull", label: "LOW" },
    medium: { variant: "amber", label: "MED" },
    high: { variant: "bear", label: "HIGH" },
  };
  const r = riskBadge[user.risk_level] ?? riskBadge.medium;

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="text-xs font-mono text-cream truncate">
        {user.email}
      </div>
      <Badge variant="neutral" size="xs">
        {user.tier}
      </Badge>
      <div className="text-[11px] font-mono text-fog tabular-nums whitespace-nowrap">
        {user.days_since_login}d ago
      </div>
      <Badge variant={r.variant} size="xs">
        {r.label}
      </Badge>
      {user.risk_level === "high" && (
        <button
          onClick={() => onWinback(user.user_id)}
          disabled={sending}
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition ring-focus bg-amber/[0.08] text-amber border border-amber/30 hover:bg-amber/[0.14] disabled:opacity-40"
        >
          {sending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          Win-back
        </button>
      )}
    </div>
  );
}

// ── Locked State ──────────────────────────────────────────────

function LockedAdmin() {
  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="label mb-1">Restricted</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Admin
        </h1>
      </div>
      <Card>
        <div className="text-center py-12">
          <Shield className="h-10 w-10 text-fog/30 mx-auto mb-4" />
          <h2 className="font-display text-xl font-medium text-cream mb-2">
            Architect Access Required
          </h2>
          <p className="text-sm text-fog font-light max-w-xs mx-auto">
            This dashboard is only available to users on the Architect tier.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export function AdminScreen() {
  const { user } = useAuth();

  // Guard
  if (!user || user.tier !== "architect") {
    return <LockedAdmin />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [churnRisk, setChurnRisk] = useState<ChurnRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingWinback, setSendingWinback] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aResp, cResp] = await Promise.all([
        fetchAdminAnalytics(),
        fetchChurnRisk(),
      ]);
      setAnalytics(aResp);
      setChurnRisk(cResp);
    } catch {
      /* fallback to empty state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleWinback = async (userId: string) => {
    setSendingWinback((prev) => new Set([...prev, userId]));
    try {
      await sendWinback(userId, "We miss you at BOVYN! Come back and get 20% off your next month.");
    } catch {
      /* ignore */
    } finally {
      setSendingWinback((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4 pb-4">
        <div>
          <div className="label mb-1">Admin</div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
            Dashboard
          </h1>
        </div>
        <Card>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-fog/40 mx-auto mb-3" />
            <p className="text-sm text-fog">Failed to load analytics</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="label mb-1">Admin</div>
          <Badge variant="amber" size="xs">ARCHITECT</Badge>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-amber/50" />}
        </div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Dashboard
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Platform analytics &amp; user health
        </p>
      </div>

      {/* KPI Row */}
      <Card tone="raised" className="!p-4">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          <KpiCard
            label="Total Users"
            value={analytics.total_users}
            icon={<Users className="h-4 w-4" />}
          />
          <KpiCard
            label="Active"
            value={analytics.active_users}
            icon={<Activity className="h-4 w-4" />}
          />
          <KpiCard
            label="MRR"
            value={analytics.mrr}
            icon={<DollarSign className="h-4 w-4" />}
            format="currency"
          />
          <KpiCard
            label="Churn"
            value={analytics.churn_rate}
            icon={<TrendingDown className="h-4 w-4" />}
            format="percent"
          />
          <KpiCard
            label="LTV"
            value={analytics.ltv}
            icon={<Clock className="h-4 w-4" />}
            format="currency"
          />
        </div>
      </Card>

      {/* Tier Distribution */}
      {analytics.tier_distribution.length > 0 && (
        <TierDistribution data={analytics.tier_distribution} />
      )}

      {/* Monthly Signups Chart */}
      {analytics.monthly_signups.length > 0 && (
        <SignupChart data={analytics.monthly_signups} />
      )}

      {/* Churn Risk Table */}
      {churnRisk && churnRisk.users.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber" />
            <div className="label">Churn Risk</div>
          </div>
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 pb-2 border-b border-white/[0.08]">
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">
              Email
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">
              Tier
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">
              Last Login
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">
              Risk
            </div>
            <div />
          </div>
          {churnRisk.users.map((u) => (
            <ChurnRow
              key={u.user_id}
              user={u}
              onWinback={handleWinback}
              sending={sendingWinback.has(u.user_id)}
            />
          ))}
        </Card>
      )}

      {/* Recent Signups */}
      {analytics.recent_signups.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-emerald-400" />
            <div className="label">Recent Signups</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {analytics.recent_signups.slice(0, 20).map((u, i) => (
              <div
                key={`${u.email}-${i}`}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-cream truncate">
                    {u.email}
                  </span>
                  <Badge
                    variant={
                      u.tier === "architect"
                        ? "amber"
                        : u.tier === "execute"
                          ? "bull"
                          : "neutral"
                    }
                    size="xs"
                  >
                    {u.tier}
                  </Badge>
                </div>
                <span className="text-[10px] font-mono text-fog whitespace-nowrap ml-2">
                  {new Date(u.joined_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
