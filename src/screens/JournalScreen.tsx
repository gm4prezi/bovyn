import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { LockOverlay } from "../components/ui/LockOverlay";
import { useApp } from "../context/AppContext";
import { useJournal } from "../hooks/useJournal";
import { gates } from "../lib/tierGates";
import { cn } from "../lib/cn";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Calendar,
  Filter,
  Search,
} from "lucide-react";

// ── Types ──
interface JournalEntry {
  id: string;
  date: string;
  dayLabel: string;
  instrument: string;
  direction: "LONG" | "SHORT";
  grade: string;
  entry: number;
  exit: number;
  pnl: number;
  result: "TP1 Hit" | "TP2 Hit" | "TP3 Hit" | "Stopped";
  contracts: number;
  session: string;
  emotions: string[];
  notes: string;
  setupName: string;
  screenshot?: string;
  aiInsight?: string;
}

// ── Mock ──
const JOURNAL: JournalEntry[] = [
  {
    id: "j1", date: "2026-04-06", dayLabel: "Monday, Apr 6",
    instrument: "NQ", direction: "LONG", grade: "S++",
    entry: 24332, exit: 24420, pnl: 1760, result: "TP2 Hit",
    contracts: 2, session: "NY AM",
    emotions: ["Confident", "Focused"],
    notes: "Clean FVG fill + displacement. Waited for NY AM macro window. Perfect execution.",
    setupName: "FVG Continuation",
    aiInsight: "This trade followed the classic FVG fill pattern with strong displacement. Your patience waiting for the NY AM macro window was the key differentiator. Consider this pattern when NQ is bullish above daily pivot.",
  },
  {
    id: "j2", date: "2026-04-06", dayLabel: "Monday, Apr 6",
    instrument: "CL", direction: "LONG", grade: "A+",
    entry: 67.40, exit: 67.72, pnl: 960, result: "TP1 Hit",
    contracts: 3, session: "NY AM",
    emotions: ["Confident"],
    notes: "OB hold at 67.40 with clean confirmation candle. Held through minor pullback.",
    setupName: "OB Bounce",
    aiInsight: "CL respected the OB at 67.40 as anticipated in the morning brief. Good discipline holding through the minor pullback.",
  },
  {
    id: "j3", date: "2026-04-05", dayLabel: "Friday, Apr 4",
    instrument: "NQ", direction: "SHORT", grade: "A+",
    entry: 24380, exit: 24418, pnl: -760, result: "Stopped",
    contracts: 2, session: "NY AM",
    emotions: ["Anxious", "FOMO"],
    notes: "Entered too early before displacement confirmed. Should have waited for BOS.",
    setupName: "BSL Sweep",
    aiInsight: "This loss was preventable. The entry lacked confirmed displacement — you entered on anticipation rather than confirmation. Your post-trade note about waiting for BOS is correct. Pattern: when feeling FOMO, force yourself to wait for the next candle.",
  },
  {
    id: "j4", date: "2026-04-05", dayLabel: "Friday, Apr 4",
    instrument: "GC", direction: "SHORT", grade: "A+",
    entry: 3024, exit: 3008, pnl: 480, result: "TP1 Hit",
    contracts: 3, session: "NY PM",
    emotions: ["Calm", "Patient"],
    notes: "BSL sweep at 3024, clean reversal into SSL at 3000. Took partials at TP1.",
    setupName: "BSL Reversal",
  },
  {
    id: "j5", date: "2026-04-04", dayLabel: "Thursday, Apr 3",
    instrument: "ES", direction: "LONG", grade: "A+",
    entry: 5892, exit: 5912, pnl: 1000, result: "TP1 Hit",
    contracts: 2, session: "NY AM",
    emotions: ["Focused"],
    notes: "ES correlated with NQ long. Took after NQ confirmation.",
    setupName: "Correlation Play",
  },
];

const EMOTIONS = ["Confident", "Focused", "Calm", "Patient", "Anxious", "FOMO", "Revenge", "Frustrated", "Hesitant"];

const EMOTION_COLORS: Record<string, string> = {
  Confident: "bg-bull/[0.10] text-bull border-bull/20",
  Focused: "bg-amber/[0.10] text-amber border-amber/20",
  Calm: "bg-teal/[0.10] text-teal border-teal/20",
  Patient: "bg-blue-400/[0.10] text-blue-400 border-blue-400/20",
  Anxious: "bg-bear/[0.10] text-bear border-bear/20",
  FOMO: "bg-bear/[0.10] text-bear border-bear/20",
  Revenge: "bg-bear/[0.12] text-bear border-bear/25",
  Frustrated: "bg-amber/[0.10] text-amber border-amber/20",
  Hesitant: "bg-white/[0.05] text-fog border-white/[0.08]",
};

type ViewFilter = "all" | "wins" | "losses";

export function JournalScreen() {
  const { tier, setTier } = useApp();
  const canUse = gates.fullSignalDetail(tier);
  const { entries: apiEntries } = useJournal();
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [journal, setJournal] = useState(JOURNAL);

  // Sync from API when available
  useEffect(() => {
    if (apiEntries.length > 0) {
      setJournal(apiEntries.map((e) => ({
        id: e.id,
        date: e.date,
        dayLabel: new Date(e.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        instrument: e.instrument ?? "NQ",
        direction: (e.direction ?? "LONG") as "LONG" | "SHORT",
        grade: e.grade ?? "A+",
        entry: e.entry_price ?? 0,
        exit: e.exit_price ?? 0,
        pnl: e.pnl,
        result: e.pnl >= 0 ? "TP1 Hit" as const : "Stopped" as const,
        contracts: e.contracts,
        session: e.session ?? "NY AM",
        emotions: e.emotion ? [e.emotion] : [],
        notes: e.notes ?? "",
        setupName: e.setup ?? "",
        aiInsight: e.ai_insight ?? undefined,
      })));
    }
  }, [apiEntries]);

  const filtered = journal.filter((j) => {
    if (filter === "wins" && j.pnl < 0) return false;
    if (filter === "losses" && j.pnl >= 0) return false;
    if (searchQuery && !j.instrument.toLowerCase().includes(searchQuery.toLowerCase()) && !j.setupName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPnl = filtered.reduce((sum, j) => sum + j.pnl, 0);
  const wins = filtered.filter((j) => j.pnl >= 0).length;
  const losses = filtered.filter((j) => j.pnl < 0).length;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="label mb-1">Trade Intelligence</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Trade Journal
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Auto-logged trades with AI insights
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <MiniStat label="Net P&L" value={`${totalPnl >= 0 ? "+" : ""}$${Math.abs(totalPnl).toLocaleString()}`} tone={totalPnl >= 0 ? "bull" : "bear"} />
        <MiniStat label="Wins" value={String(wins)} tone="bull" />
        <MiniStat label="Losses" value={String(losses)} tone="bear" />
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
          <Search className="h-3.5 w-3.5 text-fog" />
          <input
            type="text"
            placeholder="Search instrument or setup..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs text-cream placeholder:text-fog/50"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "wins", "losses"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-2 rounded-xl text-[10px] font-mono font-bold transition-all border",
                filter === f
                  ? "bg-amber/[0.10] text-amber border-amber/30"
                  : "text-fog border-white/[0.06] hover:text-cream"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Emotion heatmap */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-amber" />
          <h3 className="font-display text-lg font-medium text-cream tracking-tight">
            Emotion Patterns
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONS.map((emo) => {
            const count = journal.filter((j) => j.emotions.includes(emo)).length;
            if (count === 0) return null;
            return (
              <span
                key={emo}
                className={cn("text-[10px] font-mono font-bold px-2 py-1 rounded-lg border", EMOTION_COLORS[emo])}
              >
                {emo} ({count})
              </span>
            );
          })}
        </div>
      </Card>

      {/* Journal entries */}
      <div className="relative">
        <div className="space-y-2">
          {filtered.map((entry) => (
            <JournalEntryRow key={entry.id} entry={entry} />
          ))}
        </div>

        {!canUse && (
          <LockOverlay
            requiredTier="Operator"
            title="Trade Journal Locked"
            description="Operator unlocks your auto-logged trade journal with AI insights and emotion tracking."
            onUpgrade={() => setTier("operator")}
          />
        )}
      </div>
    </div>
  );
}

function JournalEntryRow({ entry }: { entry: JournalEntry }) {
  const [open, setOpen] = useState(false);
  const isWin = entry.pnl >= 0;

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="h-3 w-3 text-fog" /> : <ChevronRight className="h-3 w-3 text-fog" />}
          <span className="font-mono font-bold text-sm text-cream">{entry.instrument}</span>
          {entry.direction === "LONG" ? (
            <TrendingUp className="h-3.5 w-3.5 text-bull" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-bear" />
          )}
          <span className={cn("text-[10px] font-mono font-bold", isWin ? "text-bull" : "text-bear")}>
            {entry.result}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-fog">{entry.session}</span>
          <span className={cn("font-mono font-bold text-sm tabular-nums", isWin ? "text-bull" : "text-bear")}>
            {isWin ? "+" : ""}${Math.abs(entry.pnl).toLocaleString()}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.04] space-y-3">
          {/* Trade details */}
          <div className="grid grid-cols-4 gap-2 pt-3">
            <div>
              <div className="text-[9px] font-mono text-fog uppercase tracking-wider">Grade</div>
              <div className="text-xs font-mono font-bold text-amber">{entry.grade}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-fog uppercase tracking-wider">Entry</div>
              <div className="text-xs font-mono font-bold text-cream">{entry.entry}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-fog uppercase tracking-wider">Exit</div>
              <div className="text-xs font-mono font-bold text-cream">{entry.exit}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-fog uppercase tracking-wider">Contracts</div>
              <div className="text-xs font-mono font-bold text-cream">{entry.contracts}</div>
            </div>
          </div>

          {/* Setup name */}
          <div className="flex items-center gap-2">
            <Target className="h-3 w-3 text-amber" />
            <span className="text-[11px] font-mono font-bold text-amber">{entry.setupName}</span>
          </div>

          {/* Emotions */}
          <div className="flex flex-wrap gap-1.5">
            {entry.emotions.map((emo) => (
              <span key={emo} className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded border", EMOTION_COLORS[emo])}>
                {emo}
              </span>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
            <div className="text-[10px] font-mono text-fog uppercase tracking-wider mb-1">Notes</div>
            <p className="text-[12px] text-cream/80 leading-relaxed font-light">{entry.notes}</p>
          </div>

          {/* AI Insight */}
          {entry.aiInsight && (
            <div className="bg-amber/[0.04] border border-amber/15 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Brain className="h-3 w-3 text-amber" />
                <span className="text-[10px] font-mono font-bold text-amber uppercase tracking-wider">AI Insight</span>
              </div>
              <p className="text-[12px] text-cream/70 leading-relaxed font-light">{entry.aiInsight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "bull" | "bear" }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-surface p-3 text-center">
      <div className="text-[9px] font-mono font-bold tracking-[0.14em] text-fog uppercase">{label}</div>
      <div className={cn("font-mono font-bold text-lg tabular-nums", tone === "bull" ? "text-bull" : "text-bear")}>{value}</div>
    </div>
  );
}
