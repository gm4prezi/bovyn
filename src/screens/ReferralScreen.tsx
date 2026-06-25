import { useState, useEffect, useCallback } from "react";
import {
  fetchReferral,
  applyReferralCode,
  type ReferralResponse,
} from "../lib/bovynApi";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { cn } from "../lib/cn";
import {
  Gift,
  Copy,
  Check,
  Users,
  Clock,
  CheckCircle2,
  Share2,
  MessageCircle,
  Loader2,
  ArrowRight,
  Link2,
  Send,
} from "lucide-react";

// ── Copy Button ───────────────────────────────────────────────

function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ring-focus",
        copied
          ? "bg-emerald-400/[0.12] text-emerald-400 border border-emerald-400/30"
          : "bg-amber/[0.08] text-amber border border-amber/30 hover:bg-amber/[0.14]",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label ?? (copied ? "Copied" : "Copy")}
    </button>
  );
}

// ── Step Card ─────────────────────────────────────────────────

function StepCard({
  num,
  title,
  desc,
  icon,
}: {
  num: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-2">
      <div className="h-10 w-10 rounded-xl bg-amber/[0.1] border border-amber/30 flex items-center justify-center text-amber">
        {icon}
      </div>
      <div className="text-[10px] font-mono font-bold text-amber tracking-[0.12em] uppercase">
        Step {num}
      </div>
      <div className="text-sm font-medium text-cream">{title}</div>
      <div className="text-[11px] text-fog font-light leading-relaxed">
        {desc}
      </div>
    </div>
  );
}

// ── Stat Cell ─────────────────────────────────────────────────

function RefStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-fog/60">{icon}</div>
      <div className="font-mono font-bold text-2xl tabular-nums text-cream">
        {value}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-fog">
        {label}
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export function ReferralScreen() {
  const [data, setData] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply code state
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchReferral();
      setData(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referral info");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async () => {
    const code = applyCode.trim();
    if (!code) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      const resp = await applyReferralCode(code);
      setApplyMsg({ ok: resp.ok, text: resp.message });
      if (resp.ok) setApplyCode("");
    } catch (err) {
      setApplyMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to apply code",
      });
    } finally {
      setApplying(false);
    }
  };

  const referralLink = data
    ? `https://app.bovyn.io?ref=${data.code}`
    : "";

  const tweetText = encodeURIComponent(
    `I use @bovyn_io for futures signals. Real-time, graded, AI-driven.\n\nJoin with my link and we both get a free month:\n${referralLink}`
  );

  const telegramText = encodeURIComponent(
    `Check out BOVYN for AI futures signals. Join with my referral link: ${referralLink}`
  );

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-amber" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div>
        <div className="label mb-1">Earn</div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-cream leading-none">
          Referrals
        </h1>
        <p className="text-xs text-fog mt-1.5 font-light">
          Share BOVYN, earn free months
        </p>
      </div>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-amber/30 shadow-amber-glow">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber/15 blur-3xl animate-aurora-drift" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-px glow-line" />

        <div className="relative p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-amber/[0.15] border border-amber/30 flex items-center justify-center">
              <Gift className="h-5 w-5 text-amber" />
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-cream tracking-tight">
                Share BOVYN, earn free months
              </h2>
              <p className="text-xs text-fog font-light">
                For every friend who subscribes, you both get 1 month free.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral link */}
      {data && (
        <Card>
          <div className="label mb-3">Your Referral Link</div>
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5">
            <Link2 className="h-4 w-4 text-fog shrink-0" />
            <span className="font-mono text-xs text-cream/80 truncate flex-1">
              {referralLink}
            </span>
            <CopyButton text={referralLink} />
          </div>

          <div className="mt-3">
            <div className="label mb-2">Your Code</div>
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5">
              <span className="font-mono font-bold text-lg text-amber tracking-[0.12em] flex-1">
                {data.code}
              </span>
              <CopyButton text={data.code} />
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      {data && (
        <Card tone="raised" className="!p-4">
          <div className="grid grid-cols-3 gap-4">
            <RefStat
              label="Total"
              value={data.total_referrals}
              icon={<Users className="h-4 w-4" />}
            />
            <RefStat
              label="Credited"
              value={data.credited}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <RefStat
              label="Pending"
              value={data.pending}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
        </Card>
      )}

      {/* Share buttons */}
      {data && (
        <Card>
          <div className="label mb-3">Share</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <CopyButton
              text={referralLink}
              label="Copy Link"
              className="flex-1 justify-center py-2.5"
            />
            <a
              href={`https://twitter.com/intent/tweet?text=${tweetText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg transition ring-focus bg-white/[0.04] text-cream border border-white/[0.08] hover:border-amber/30 hover:text-amber"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share on X
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${telegramText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg transition ring-focus bg-white/[0.04] text-cream border border-white/[0.08] hover:border-amber/30 hover:text-amber"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Telegram
            </a>
          </div>
        </Card>
      )}

      {/* How it works */}
      <Card>
        <div className="label mb-4">How It Works</div>
        <div className="grid grid-cols-3 gap-1">
          <StepCard
            num={1}
            title="Share your link"
            desc="Send your unique link to a friend"
            icon={<Send className="h-5 w-5" />}
          />
          <StepCard
            num={2}
            title="Friend subscribes"
            desc="They sign up with an active plan"
            icon={<Users className="h-5 w-5" />}
          />
          <StepCard
            num={3}
            title="Free month"
            desc="You both get 1 month added"
            icon={<Gift className="h-5 w-5" />}
          />
        </div>
        {/* Arrows between steps (desktop only) */}
        <div className="hidden sm:flex items-center justify-center gap-[7.5rem] -mt-[5.5rem] mb-6 pointer-events-none">
          <ArrowRight className="h-4 w-4 text-amber/40" />
          <ArrowRight className="h-4 w-4 text-amber/40" />
        </div>
      </Card>

      {/* Apply a code */}
      <Card>
        <div className="label mb-2">Have a Referral Code?</div>
        <p className="text-[11px] text-fog mb-3 font-light">
          Enter a friend's code to link your account.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            maxLength={12}
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 font-mono text-sm text-cream placeholder:text-fog/40 focus:border-amber/50 focus:outline-none transition-all"
          />
          <button
            onClick={handleApply}
            disabled={applying || !applyCode.trim()}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg transition ring-focus",
              "bg-amber text-bg hover:brightness-[1.08] shadow-amber-glow-sm",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            {applying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Apply
          </button>
        </div>
        {applyMsg && (
          <p
            className={cn(
              "text-xs mt-2 font-mono",
              applyMsg.ok ? "text-emerald-400" : "text-red-400"
            )}
          >
            {applyMsg.text}
          </p>
        )}
      </Card>

      {/* Error state */}
      {error && !data && (
        <Card>
          <p className="text-sm text-red-400 text-center py-4">{error}</p>
        </Card>
      )}
    </div>
  );
}
