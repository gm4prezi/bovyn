import { useState, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { useApp } from "../context/AppContext";
import { useBriefing } from "../hooks/useBriefing";
import { cn } from "../lib/cn";
import {
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react";

// ── Types ──
interface InstrumentBrief {
  symbol: string;
  bias: "bullish" | "bearish" | "neutral";
  keyLevel: string;
  read: string;
  grade: string;
}

interface KeyEvent {
  time: string;
  event: string;
  impact: "high" | "medium" | "low";
  instrument?: string;
}

interface BriefData {
  date: string;
  session: string;
  regime: string;
  regimeTone: "risk-on" | "risk-off" | "mixed";
  summary: string;
  instruments: InstrumentBrief[];
  keyEvents: KeyEvent[];
  topSetups: string[];
  avoidToday: string[];
}

// ── Mock data (will be replaced by GET /api/brief/today) ──
const MORNING_BRIEF: BriefData = {
  date: "Monday, April 6",
  session: "NY AM",
  regime: "MIXED — Trending with Caution",
  regimeTone: "mixed",
  summary:
    "Indices swept overnight lows into London session, reclaimed and rallied into NY open. NQ and ES showing bullish structure above key pivots. GC and SI extended — watch for mean reversion. CL holding above OB at 67.40. RTY lagging, no clean setup. YM following ES but with less conviction.",
  instruments: [
    { symbol: "NQ", bias: "bullish", keyLevel: "24,332", read: "Bullish above 24,300 pivot. FVG fill complete, watching for continuation to 24,400 BSL.", grade: "A+" },
    { symbol: "ES", bias: "bullish", keyLevel: "5,892", read: "Correlated bullish with NQ. Reclaimed daily pivot, holding above VAH.", grade: "A+" },
    { symbol: "YM", bias: "bullish", keyLevel: "43,850", read: "Following ES. Weaker conviction — lagging. Only trade if NQ/ES confirm.", grade: "A" },
    { symbol: "RTY", bias: "neutral", keyLevel: "2,278", read: "Swept and reclaimed 2,278 but no clear displacement. Ranging — skip.", grade: "—" },
    { symbol: "CL", bias: "bullish", keyLevel: "67.40", read: "Holding OB at 67.40. Clean setup if it holds into NY AM macro.", grade: "A+" },
    { symbol: "GC", bias: "bearish", keyLevel: "3,024", read: "Extended above 3,020. Swept BSL — watching for short setup into 3,000 SSL.", grade: "A" },
    { symbol: "SI", bias: "bearish", keyLevel: "34.20", read: "Overextended. Short only with ELITE consensus (≥8.0).", grade: "A" },
  ],
  keyEvents: [
    { time: "08:30", event: "ISM Services PMI", impact: "high", instrument: "NQ" },
    { time: "10:00", event: "Factory Orders", impact: "medium", instrument: "ES" },
    { time: "13:00", event: "3-Year Note Auction", impact: "low" },
    { time: "14:00", event: "Fed Waller Speaks", impact: "high" },
  ],
  topSetups: [
    "NQ LONG above 24,300 if NY AM macro holds — target BSL at 24,400",
    "CL LONG from 67.40 OB on confirmation — tight stop below 67.20",
    "GC SHORT if it loses 3,020 — target SSL at 3,000",
  ],
  avoidToday: [
    "RTY — ranging, no displacement, skip entirely",
    "SI — only with ELITE consensus, overextended",
    "Any LONG after 14:00 if Fed Waller is hawkish",
  ],
};

const REGIME_STYLES = {
  "risk-on": { bg: "bg-bull/[0.06]", border: "border-bull/20", text: "text-bull", icon: TrendingUp },
  "risk-off": { bg: "bg-bear/[0.06]", border: "border-bear/20", text: "text-bear", icon: TrendingDown },
  "mixed": { bg: "bg-amber/[0.06]", border: "border-amber/20", text: "text-amber", icon: AlertTriangle },
};

const BIAS_ICON = {
  bullish: { icon: TrendingUp, color: "text-bull" },
  bearish: { icon: TrendingDown, color: "text-bear" },
  neutral: { icon: Minus, color: "text-fog" },
};

const IMPACT_STYLE = {
  high: "bg-bear/[0.12] text-bear border-bear/20",
  medium: "bg-amber/[0.10] text-amber border-amber/20",
  low: "bg-white/[0.04] text-fog border-white/[0.08]",
};

export function BriefScreen() {
  const { setActiveScreen } = useApp();
  const [briefType, setBriefType] = useState<"morning" | "eod">("morning");
  const apiType = briefType === "morning" ? "am" as const : "eod" as const;
  const { data: apiData, loading } = useBriefing(apiType);

  const brief = useMemo<BriefData>(() => {
    if (!apiData) return MORNING_BRIEF;
    const biasMap: Record<string, "bullish" | "bearish" | "neutral"> = {};
    for (const [sym, rd] of Object.entries(apiData.instruments ?? {})) {
      const d = rd.direction?.toUpperCase();
      biasMap[sym] = d === "LONG" ? "bullish" : d === "SHORT" ? "bearish" : "neutral";
    }
    return {
      date: apiData.date ?? MORNING_BRIEF.date,
      session: apiData.session ?? MORNING_BRIEF.session,
      regime: apiData.regime_label ?? MORNING_BRIEF.regime,
      regimeTone: apiData.daily_bias === "bullish" ? "risk-on" : apiData.daily_bias === "bearish" ? "risk-off" : "mixed",
      summary: MORNING_BRIEF.summary,
      instruments: Object.entries(apiData.instruments ?? {}).map(([sym, rd]) => ({
        symbol: sym,
        bias: biasMap[sym] ?? "neutral",
        keyLevel: "",
        read: `${rd.consensus} consensus (${rd.score != null ? rd.score.toFixed(1) : "—"})`,
        grade: rd.grade ?? "",
      })),
      keyEvents: (apiData.key_events ?? []).map((e) => ({
        time: e.time, event: e.title, impact: e.impact as "high" | "medium" | "low",
      })),
      topSetups: apiData.top_setups?.map((s) => `${s.instrument} ${s.direction} — ${s.grade} grade, ${s.setup_name || "setup"}`) ?? MORNING_BRIEF.topSetups,
      avoidToday: apiData.avoid_today?.map((a) => `${a.instrument} — ${a.reason}`) ?? MORNING_BRIEF.avoidToday,
    };
  }, [apiData]);

  const regime = REGIME_STYLES[brief.regimeTone];
  const RegimeIcon = regime.icon;

  return (
    <div className="space-y-4 pb-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="label mb-1">Daily Intelligence</div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
            Briefing
          </h1>
          <p className="text-xs text-fog mt-1.5 font-light">{brief.date}</p>
        </div>
        <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          <button
            onClick={() => setBriefType("morning")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all",
              briefType === "morning" ? "bg-amber/[0.12] text-amber" : "text-fog hover:text-cream"
            )}
          >
            <Sun className="h-3 w-3" /> AM
          </button>
          <button
            onClick={() => setBriefType("eod")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all",
              briefType === "eod" ? "bg-amber/[0.12] text-amber" : "text-fog hover:text-cream"
            )}
          >
            <Moon className="h-3 w-3" /> EOD
          </button>
        </div>
      </div>

      {/* ── Market Regime ── */}
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", regime.bg, regime.border)}>
        <RegimeIcon className={cn("h-4 w-4 flex-shrink-0", regime.text)} />
        <div>
          <div className={cn("text-xs font-mono font-bold tracking-wider", regime.text)}>
            {brief.regime}
          </div>
          <div className="text-[10px] text-fog mt-0.5 font-mono">{brief.session} Session</div>
        </div>
      </div>

      {/* ── Summary ── */}
      <Card>
        <div className="label mb-2">Market Summary</div>
        <p className="text-sm text-cream/90 leading-relaxed font-light">
          {brief.summary}
        </p>
      </Card>

      {/* ── Instrument Reads ── */}
      <Card>
        <div className="label mb-1">7 Instruments</div>
        <h3 className="font-display text-xl font-medium text-cream mb-4 tracking-tight">
          Today's Reads
        </h3>
        <div className="space-y-2">
          {brief.instruments.map((inst) => (
            <InstrumentRow key={inst.symbol} inst={inst} />
          ))}
        </div>
      </Card>

      {/* ── Top Setups ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber" />
          <h3 className="font-display text-xl font-medium text-cream tracking-tight">
            Top Setups
          </h3>
        </div>
        <div className="space-y-2">
          {brief.topSetups.map((setup, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-bull/[0.04] border border-bull/10"
            >
              <span className="text-[10px] font-mono font-bold text-bull bg-bull/[0.12] rounded px-1.5 py-0.5 flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-[12px] text-cream/80 leading-relaxed font-light">{setup}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Avoid Today ── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-bear" />
          <h3 className="font-display text-xl font-medium text-cream tracking-tight">
            Avoid Today
          </h3>
        </div>
        <div className="space-y-2">
          {brief.avoidToday.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-bear/[0.04] border border-bear/10"
            >
              <span className="text-[10px] font-mono font-bold text-bear bg-bear/[0.12] rounded px-1.5 py-0.5 flex-shrink-0">
                !
              </span>
              <p className="text-[12px] text-cream/80 leading-relaxed font-light">{item}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Key Events ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fog" />
            <h3 className="font-display text-xl font-medium text-cream tracking-tight">
              Key Events
            </h3>
          </div>
          <button
            onClick={() => setActiveScreen("calendar")}
            className="text-[10px] font-mono font-bold text-amber hover:text-amber/80 transition-colors"
          >
            Full Calendar &rarr;
          </button>
        </div>
        <div className="space-y-1.5">
          {brief.keyEvents.map((evt, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-3 w-3 text-fog/50" />
                <span className="text-[11px] font-mono text-fog">{evt.time}</span>
                <span className="text-[12px] text-cream/80">{evt.event}</span>
              </div>
              <div className="flex items-center gap-2">
                {evt.instrument && (
                  <span className="text-[10px] font-mono font-bold text-cream/60">{evt.instrument}</span>
                )}
                <span className={cn("text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border", IMPACT_STYLE[evt.impact])}>
                  {evt.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Expandable instrument row ──
function InstrumentRow({ inst }: { inst: InstrumentBrief }) {
  const [open, setOpen] = useState(false);
  const { icon: BiasIcon, color } = BIAS_ICON[inst.bias];

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-3 w-3 text-fog" /> : <ChevronRight className="h-3 w-3 text-fog" />}
          <span className="font-mono font-bold text-sm text-cream">{inst.symbol}</span>
          <BiasIcon className={cn("h-3.5 w-3.5", color)} />
          <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", color)}>
            {inst.bias}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-fog">@ {inst.keyLevel}</span>
          {inst.grade !== "—" && (
            <span className={cn(
              "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
              inst.grade === "A+" ? "text-amber bg-amber/[0.10]" : "text-fog bg-white/[0.05]"
            )}>
              {inst.grade}
            </span>
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0 border-t border-white/[0.04]">
          <p className="text-[12px] text-cream/70 leading-relaxed font-light pt-2.5">
            {inst.read}
          </p>
        </div>
      )}
    </div>
  );
}
