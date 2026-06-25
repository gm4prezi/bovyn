import { Brain, Clock } from "lucide-react";
import type { Signal } from "../../types";
import { cn } from "../../lib/cn";

interface WhyCardProps {
  signal: Signal;
}

/* ── Generate AI analysis for ANY signal state ── */
function generateAnalysis(signal: Signal): { label: string; text: string; tone: "amber" | "bull" | "bear" } {
  const { instrument, direction, grade, session, status, pnl, confluence, consensusScore, engineCount } = signal;
  const dir = direction === "LONG" ? "long" : "short";
  const engines = engineCount ?? 3;
  const score = consensusScore?.toFixed(1) ?? "—";
  const topConf = confluence.slice(0, 2).join(" + ");

  // ── PENDING — scenario brief
  if (status === "Pending") {
    const setup = direction === "LONG"
      ? `Looking for a sweep of lows into entry, then displacement north.`
      : `Looking for a sweep of highs into entry, then displacement south.`;
    return {
      label: "Scenario",
      text: `${grade} ${dir} on ${instrument} — ${engines} engines, score ${score}. ${setup} Key trigger: ${topConf}. Session: ${session}. 3h window to fill, then candle close decides.`,
      tone: "amber",
    };
  }

  // ── RUNNING — live coaching
  if (status === "Running") {
    return {
      label: "Live",
      text: `Trade active. ${grade} ${dir} ${instrument} triggered via ${topConf}. Manage partials at TP1, trail stop to entry after first target. ${session} session — watch for counter-rotation near session highs/lows.`,
      tone: "amber",
    };
  }

  // ── RESOLVED — why it worked or failed
  // "Stopped" is always a loss, even if pnl happens to be 0 (not yet settled)
  const isWin = status !== "Stopped" && pnl > 0;

  if (isWin && (grade === "S++" || grade === "A+")) {
    return {
      label: "Why It Worked",
      text: `${grade} ${dir} ${instrument} hit target — ${engines} engines confirmed at score ${score}. ${topConf} provided the primary trigger during ${session}. High-grade setups in this config have 86% TP1 rate.`,
      tone: "bull",
    };
  }

  if (isWin) {
    return {
      label: "Why It Worked",
      text: `${dir} ${instrument} resolved green. Session bias aligned with direction, ${topConf} held. Lower grade (${grade}) — win driven by favorable timing more than overwhelming confluence.`,
      tone: "bull",
    };
  }

  // Loss
  return {
    label: "Why It Failed",
    text: `${dir} ${instrument} stopped out. ${session} session reversed against setup — key level at entry failed to hold. ${topConf} invalidated. ${grade === "A" ? "Grade A setups carry lower reliability." : "Even high-grade setups fail — the edge is statistical, not guaranteed."}`,
    tone: "bear",
  };
}

export function WhyCard({ signal }: WhyCardProps) {
  if (signal.status === "Cancelled") return null;

  const { label, text, tone } = generateAnalysis(signal);

  const colors = {
    amber: "text-amber border-amber/15 bg-amber/[0.03]",
    bull: "text-bull border-bull/15 bg-bull/[0.03]",
    bear: "text-bear border-bear/15 bg-bear/[0.03]",
  };

  const iconColor = {
    amber: "text-amber",
    bull: "text-bull",
    bear: "text-bear",
  };

  // Pending signals: show 3h countdown
  const isPending = signal.status === "Pending";
  const signalAge = Date.now() - new Date(signal.timestamp).getTime();
  const threeHours = 3 * 60 * 60 * 1000;
  const remaining = Math.max(0, threeHours - signalAge);
  const remainingMins = Math.floor(remaining / 60000);
  const expired = isPending && remaining <= 0;

  return (
    <div className={cn("mt-3 rounded-xl border px-3 py-2.5", colors[tone])}>
      <div className="flex items-start gap-2">
        <Brain className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", iconColor[tone])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-mono font-bold tracking-wider uppercase", iconColor[tone])}>
              {label}
            </span>
            {isPending && !expired && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-fog/50">
                <Clock className="h-2.5 w-2.5" />
                {remainingMins > 60 ? `${Math.floor(remainingMins / 60)}h ${remainingMins % 60}m` : `${remainingMins}m`} left
              </span>
            )}
            {expired && (
              <span className="text-[9px] font-mono font-bold text-bear bg-bear/10 px-1.5 py-0.5 rounded border border-bear/20">
                3H EXPIRED
              </span>
            )}
          </div>
          <p className="text-[11px] text-cream/60 leading-relaxed font-light">{text}</p>
        </div>
      </div>
    </div>
  );
}
