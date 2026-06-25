import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "../components/ui/Card";
import { useApp } from "../context/AppContext";
import { useUserSettings } from "../hooks/useUserSettings";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { TIERS, TIER_ORDER } from "../data/tiers";
import { gates } from "../lib/tierGates";
import { INSTRUMENTS } from "../data/instruments";
import { cn } from "../lib/cn";
import { Badge } from "../components/ui/Badge";
import { InlineLock } from "../components/ui/LockOverlay";
import { disconnectTelegram, testTelegram } from "../lib/bovynApi";
import {
  ChevronRight,
  User,
  CreditCard,
  HelpCircle,
  Key,
  Plug,
  FileText,
  Bell,
  MessageCircle,
  Webhook,
  Mail,
  ArrowUpRight,
  BookOpen,
  BarChart2,
  Target,
  BellRing,
  Rewind,
  Shield,
  Calendar,
  Calculator,
  TrendingUp,
  Gift,
} from "lucide-react";

export function SettingsScreen() {
  const { tier, setTier, setActiveScreen, accountSize, setAccountSize, riskPct, setRiskPct } = useApp();
  const { data: apiSettings, save: saveSettings } = useUserSettings();
  const { state: pushState, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const [telegramBusy, setTelegramBusy] = useState(false);
  const cfg = TIERS[tier];
  const canCustomFilters = gates.signalFilters(tier);

  const nextTier = TIER_ORDER[Math.min(TIER_ORDER.indexOf(tier) + 1, TIER_ORDER.length - 1)];
  const isHighest = tier === "architect";

  // Interactive filter state
  const [enabledInstruments, setEnabledInstruments] = useState<Set<string>>(new Set(INSTRUMENTS.map(i => i.symbol)));
  const [minGrade, setMinGrade] = useState<string>("A");
  const [enabledSessions, setEnabledSessions] = useState<Set<string>>(new Set(["London", "NY AM", "NY PM"]));

  // Sync from API when available
  useEffect(() => {
    if (!apiSettings) return;
    if (apiSettings.account_size > 0) setAccountSize(apiSettings.account_size);
    if (apiSettings.risk_pct > 0) setRiskPct(apiSettings.risk_pct);
    if (apiSettings.instruments) {
      const syms = apiSettings.instruments.split(",").map(s => s.trim()).filter(Boolean);
      if (syms.length > 0) setEnabledInstruments(new Set(syms));
    }
    if (apiSettings.min_grade) setMinGrade(apiSettings.min_grade);
    if (apiSettings.sessions) {
      const sess = apiSettings.sessions.split(",").map(s => s.trim()).filter(Boolean);
      if (sess.length > 0) setEnabledSessions(new Set(sess));
    }
  }, [apiSettings, setAccountSize, setRiskPct]);

  // Debounced save to API
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const persistSettings = useCallback((patch: Record<string, unknown>) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSettings(patch).catch(() => {});
    }, 800);
  }, [saveSettings]);

  const handleAccountSizeChange = (val: number) => {
    setAccountSize(val);
    persistSettings({ account_size: val });
  };

  const handleRiskPctChange = (val: number) => {
    setRiskPct(val);
    persistSettings({ risk_pct: val });
  };

  const toggleInstrument = (sym: string) => {
    setEnabledInstruments(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      persistSettings({ instruments: Array.from(next).join(",") });
      return next;
    });
  };

  const toggleSession = (session: string) => {
    setEnabledSessions(prev => {
      const next = new Set(prev);
      if (next.has(session)) next.delete(session); else next.add(session);
      persistSettings({ sessions: Array.from(next).join(",") });
      return next;
    });
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="label mb-1">Account</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Settings
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">Plan, filters, delivery, account</p>
      </div>

      {/* Plan card — hero */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-amber/30 shadow-amber-glow">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber/15 blur-3xl animate-aurora-drift" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-px glow-line" />

        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono font-bold tracking-[0.14em] uppercase mb-1 text-amber">
                Current Plan
              </div>
              <div className="font-display text-4xl font-medium tracking-tight text-cream leading-none">
                {cfg.name}
              </div>
              <div className="text-xs mt-1.5 text-fog font-light italic">
                {cfg.promise}
              </div>
              <div className="text-[10px] font-mono font-bold text-amber/90 tracking-[0.08em] mt-2 uppercase">
                {cfg.tagline}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-2xl tabular-nums text-gradient-amber">
                {cfg.price}
              </div>
              <div className="text-[10px] font-mono tracking-[0.1em] text-fog">
                /month
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <div className="text-[11px] text-fog font-mono">
              Renews · May 5, 2026
            </div>
            {!isHighest && (
              <button
                onClick={() => setTier(nextTier)}
                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition bg-amber text-bg hover:brightness-[1.08] shadow-amber-glow-sm"
              >
                Upgrade to {TIERS[nextTier].name}
                <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier switcher — demo only */}
      <Card tone="raised">
        <div className="label mb-2">Demo · Switch Tier</div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {TIER_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "text-[10px] font-mono font-bold py-2.5 rounded-lg transition-all ring-focus min-h-[36px]",
                tier === t
                  ? "bg-amber text-bg shadow-amber-glow-sm"
                  : "bg-white/[0.04] border border-white/[0.08] text-cream/80 hover:text-cream hover:border-amber/30"
              )}
            >
              {TIERS[t].name.slice(0, 4).toUpperCase()}
            </button>
          ))}
        </div>
      </Card>

      {/* Trading Account — for personalized sizing */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-amber" />
          <h3 className="font-display text-xl font-medium text-cream tracking-tight">Trading Account</h3>
        </div>
        <p className="text-[11px] text-fog mb-4 font-light">
          Set your account size and risk % to see personalized contract sizing on every signal.
        </p>
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-xs font-medium text-cream">Account Size</label>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-amber/50 transition-all">
              <span className="font-mono text-sm text-fog">$</span>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => handleAccountSizeChange(parseFloat(e.target.value) || 0)}
                min={1000}
                step={1000}
                className="flex-1 bg-transparent outline-none font-mono font-semibold text-cream text-sm tabular-nums"
              />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-xs font-medium text-cream">Risk per Trade</label>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-amber/50 transition-all">
              <input
                type="number"
                value={riskPct}
                onChange={(e) => handleRiskPctChange(parseFloat(e.target.value) || 0)}
                min={0.25}
                max={5}
                step={0.25}
                className="flex-1 bg-transparent outline-none font-mono font-semibold text-cream text-sm tabular-nums"
              />
              <span className="font-mono text-sm text-fog">%</span>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 px-3 py-2 rounded-xl bg-amber/[0.04] border border-amber/15">
            <span className="text-[10px] font-mono font-bold text-amber uppercase tracking-wider">Preview</span>
            <span className="text-xs font-mono text-cream">
              ${((accountSize * riskPct) / 100).toFixed(0)} risk per trade
            </span>
          </div>
        </div>
      </Card>

      {/* Signal Filters */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl font-medium text-cream tracking-tight">Signal Filters</h3>
          {!canCustomFilters && <InlineLock label="Operator" />}
        </div>

        <div className="space-y-4">
          {/* Instruments */}
          <div>
            <div className="label mb-2">Instruments</div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {INSTRUMENTS.map((i) => (
                <button
                  key={i.symbol}
                  onClick={() => canCustomFilters && toggleInstrument(i.symbol)}
                  className={cn(
                    "text-center px-2 py-1.5 rounded-lg font-mono font-bold text-[11px] transition-all",
                    canCustomFilters && enabledInstruments.has(i.symbol)
                      ? "bg-amber/[0.08] text-amber border border-amber/25"
                      : canCustomFilters
                      ? "bg-white/[0.03] text-fog/50 border border-white/[0.04]"
                      : "bg-white/[0.03] text-fog border border-white/[0.06] opacity-60"
                  )}
                >
                  {i.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Grades */}
          <div>
            <div className="label mb-2">Minimum Grade</div>
            <div className="flex gap-2">
              {["S++", "A+", "A"].map((g) => (
                <button
                  key={g}
                  onClick={() => { if (canCustomFilters) { setMinGrade(g); persistSettings({ min_grade: g }); } }}
                  className={cn(
                    "flex-1 text-center px-3 py-2 rounded-lg font-mono font-bold text-xs transition-all",
                    minGrade === g && canCustomFilters
                      ? "bg-amber text-bg shadow-amber-glow-sm"
                      : "bg-white/[0.03] text-fog border border-white/[0.06]"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions */}
          <div>
            <div className="label mb-2">Sessions</div>
            <div className="grid grid-cols-4 gap-1.5">
              {["Asia", "London", "NY AM", "NY PM"].map((s) => (
                <button
                  key={s}
                  onClick={() => canCustomFilters && toggleSession(s)}
                  className={cn(
                    "text-center px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all",
                    canCustomFilters && enabledSessions.has(s)
                      ? "bg-amber/[0.08] text-amber border border-amber/25"
                      : canCustomFilters
                      ? "bg-white/[0.03] text-fog/50 border border-white/[0.04]"
                      : "bg-white/[0.03] text-fog border border-white/[0.06]"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Delivery */}
      <Card>
        <h3 className="font-display text-xl font-medium text-cream mb-3 tracking-tight">Delivery</h3>
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cream/80 [&>svg]:h-3.5 [&>svg]:w-3.5">
              <Bell />
            </span>
            <span className="text-xs font-medium text-cream">Push Notifications</span>
          </div>
          {pushState === "unsupported" ? (
            <span className="text-[10px] font-mono text-fog">Not supported</span>
          ) : pushState === "denied" ? (
            <span className="text-[10px] font-mono text-bear">Blocked in browser</span>
          ) : pushState === "loading" ? (
            <span className="text-[10px] font-mono text-fog animate-pulse">...</span>
          ) : pushState === "subscribed" ? (
            <button
              onClick={pushUnsubscribe}
              className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-bull/10 text-bull border border-bull/20"
            >
              ON
            </button>
          ) : (
            <button
              onClick={pushSubscribe}
              className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-white/[0.04] text-fog border border-white/[0.08] hover:border-amber/30 hover:text-amber transition"
            >
              Enable
            </button>
          )}
        </div>
        <DeliveryRow icon={<MessageCircle />} label="Telegram Relay" enabled />
        <DeliveryRow
          icon={<Webhook />}
          label="Webhook Output"
          enabled={gates.webhooks(tier)}
          locked={!gates.webhooks(tier)}
        />
        <DeliveryRow icon={<Mail />} label="Email Digest" enabled={false} />

        {/* Telegram linking CTA */}
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/20">
            <MessageCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-cream mb-0.5">Telegram Connected</div>
              <div className="text-[10px] text-fog font-mono">@bovyn_signals_bot · Chat ID: 8291034</div>
              <div className="flex gap-2 mt-2">
                <button
                  disabled={telegramBusy}
                  onClick={async () => {
                    setTelegramBusy(true);
                    try { await testTelegram(); } catch { /* ignore */ }
                    setTelegramBusy(false);
                  }}
                  className="text-[10px] font-mono font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  Send Test Message
                </button>
                <span className="text-fog">·</span>
                <button
                  disabled={telegramBusy}
                  onClick={async () => {
                    setTelegramBusy(true);
                    try { await disconnectTelegram(); } catch { /* ignore */ }
                    setTelegramBusy(false);
                  }}
                  className="text-[10px] font-mono font-bold text-fog hover:text-cream transition-colors disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tools & Features */}
      <Card>
        <h3 className="font-display text-xl font-medium text-cream mb-3 tracking-tight">Tools & Features</h3>
        <div className="divide-y divide-white/[0.06]">
          <MenuRow icon={<TrendingUp />} label="Track Record" detail="Verified signal performance" onClick={() => setActiveScreen("track-record")} />
          <MenuRow icon={<Gift />} label="Referrals" detail="Share & earn free months" onClick={() => setActiveScreen("referral")} />
          <MenuRow icon={<Calendar />} label="Economic Calendar" detail="High-impact events" onClick={() => setActiveScreen("calendar")} />
          <MenuRow icon={<BookOpen />} label="Trade Journal" detail="Auto-logged with AI insights" onClick={() => setActiveScreen("journal")} />
          <MenuRow icon={<BarChart2 />} label="Weekly Report" detail="AI-generated recap" onClick={() => setActiveScreen("weekly-report")} />
          <MenuRow icon={<Target />} label="Goal Planner" detail="Targets & guardrails" onClick={() => setActiveScreen("goal-planner")} />
          <MenuRow icon={<BellRing />} label="Alert Builder" detail="Custom price alerts" onClick={() => setActiveScreen("alert-builder")} />
          <MenuRow icon={<Rewind />} label="Replay Mode" detail="Historical session DVR" onClick={() => setActiveScreen("replay")} />
          {gates.webhooks(tier) && (
            <MenuRow icon={<Webhook />} label="Webhooks" detail="Send signals to external services" onClick={() => setActiveScreen("webhooks")} />
          )}
          {gates.connectedAccounts(tier) && (
            <MenuRow icon={<Shield />} label="Risk Dashboard" detail="Account health monitor" onClick={() => setActiveScreen("risk-dashboard")} />
          )}
          {gates.algoConfig(tier) && (
            <MenuRow icon={<Shield />} label="Admin Dashboard" detail="Analytics & user health" onClick={() => setActiveScreen("admin")} />
          )}
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h3 className="font-display text-xl font-medium text-cream mb-3 tracking-tight">Account</h3>
        <div className="divide-y divide-white/[0.06]">
          <MenuRow icon={<User />} label="Profile" />
          <MenuRow icon={<CreditCard />} label="Billing & Invoices" />
          {gates.webhooks(tier) && <MenuRow icon={<Key />} label="API Keys & Webhooks" />}
          {gates.connectedAccounts(tier) && (
            <MenuRow icon={<Plug />} label="Connected Accounts" detail="Topstep · Rithmic" />
          )}
          {gates.algoConfig(tier) && (
            <>
              <MenuRow icon={<FileText />} label="Algo Configuration" />
              <MenuRow icon={<FileText />} label="Strategy Revisions" detail="2 remaining" />
              <MenuRow icon={<FileText />} label="Backtest Reports" />
            </>
          )}
          <MenuRow icon={<HelpCircle />} label="Help & Support" />
        </div>
      </Card>

      <div className="text-center pt-2">
        <div className="text-[10px] font-mono font-bold tracking-[0.14em] text-fog/70 uppercase">
          BOVYN v1.0 · app.bovyn.com
        </div>
      </div>
    </div>
  );
}

function DeliveryRow({
  icon,
  label,
  enabled,
  locked,
}: {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cream/80 [&>svg]:h-3.5 [&>svg]:w-3.5">
          {icon}
        </span>
        <span className="text-xs font-medium text-cream">{label}</span>
      </div>
      {locked ? (
        <Badge variant="amber" size="xs">OPERATOR</Badge>
      ) : (
        <div
          className={cn(
            "h-5 w-9 rounded-full relative transition-colors",
            enabled ? "bg-amber shadow-amber-glow-sm" : "bg-white/[0.1]"
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full shadow transition-all",
              enabled ? "left-[18px] bg-bg" : "left-0.5 bg-cream"
            )}
          />
        </div>
      )}
    </div>
  );
}

function MenuRow({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ touchAction: "manipulation" }}
      className="w-full flex items-center justify-between py-3.5 px-1 rounded-lg hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors min-h-[52px]"
    >
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cream/80 flex-shrink-0 [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <div className="text-left">
          <div className="text-sm font-medium text-cream">{label}</div>
          {detail && <div className="text-[10px] text-fog font-mono">{detail}</div>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-fog flex-shrink-0" />
    </button>
  );
}
