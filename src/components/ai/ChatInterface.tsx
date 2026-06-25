import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import type { ChatMessage, Tier } from "../../types";
import { cn } from "../../lib/cn";
import { aiDailyLimit } from "../../lib/tierGates";
import { Logo } from "../ui/Logo";
import { LiveDot } from "../ui/LiveDot";
import { fetchAiChat } from "../../lib/bovynApi";

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content:
      "BOVYN AI is live. I have full context on all 7 instruments — consensus scores, engine confirmations, market regime, and live pipeline data. Ask me anything.",
    timestamp: new Date().toISOString(),
  },
];

const QUICK_PROMPTS = [
  "NQ bias?",
  "Key levels today",
  "CL setup?",
  "GC short thesis",
  "RTY outlook",
];

interface ChatInterfaceProps {
  tier: Tier;
  queriesUsed: number;
  onQuery: () => void;
}

export function ChatInterface({ tier, queriesUsed, onQuery }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const limit = aiDailyLimit(tier);
  const unlimited = limit === "unlimited";
  const remaining = unlimited ? Infinity : (limit as number) - queriesUsed;
  const canSend = remaining > 0 && !typing;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  async function sendMessage(content: string) {
    if (!content.trim() || !canSend) return;
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetchAiChat(content, ac.signal);
      onQuery();
      setMessages((m) => [
        ...m,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: res.response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((m) => [
        ...m,
        {
          id: `e_${Date.now()}`,
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to reach BOVYN AI. Try again."}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10.5rem)] sm:h-[calc(100dvh-11rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Logo showWordmark={false} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber ring-2 ring-bg animate-pulse-dot" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-medium text-cream tracking-tight">BOVYN AI</span>
              <LiveDot tone="amber" />
            </div>
            <div className="text-[11px] text-fog font-light">
              Live pipeline · 17 engines · consensus scoring
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono font-bold tracking-[0.14em] text-fog uppercase">
            Queries
          </div>
          <div className="font-mono font-bold text-sm text-amber">
            {unlimited ? "\u221E" : `${queriesUsed} / ${limit}`}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-1 space-y-4 py-2"
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {typing && <TypingIndicator />}
      </div>

      {/* Quick prompts */}
      <div className="py-3 -mx-4 px-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={!canSend}
              className={cn(
                "flex-shrink-0 text-xs font-medium text-cream/80 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5 hover:text-amber hover:border-amber/30 transition-colors ring-focus",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 bg-surface border border-white/[0.08] rounded-2xl pl-4 pr-2 py-2 shadow-card focus-within:border-amber/40 transition-colors"
      >
        <Sparkles className="h-4 w-4 text-amber flex-shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={canSend ? "Ask about any of the 7 instruments\u2026" : "Daily limit reached \u2014 upgrade for unlimited"}
          disabled={!canSend}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-fog/70 text-cream disabled:text-fog font-light"
        />
        <button
          type="submit"
          disabled={!input.trim() || !canSend}
          className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center transition-all ring-focus flex-shrink-0",
            input.trim() && canSend
              ? "bg-amber text-bg shadow-amber-glow-sm active:scale-95"
              : "bg-white/[0.04] text-fog"
          )}
        >
          <Send className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex animate-slide-up", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-amber text-bg rounded-br-md font-medium"
            : "bg-surface border border-white/[0.08] text-cream rounded-bl-md shadow-card"
        )}
      >
        {!isUser && (
          <div className="text-[10px] font-mono font-bold tracking-[0.14em] text-amber uppercase mb-1">
            BOVYN AI
          </div>
        )}
        <div className={cn("font-light whitespace-pre-wrap", isUser ? "text-bg font-medium" : "text-cream")}>{message.content}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-surface border border-white/[0.08] rounded-2xl rounded-bl-md shadow-card px-4 py-3">
        <div className="flex items-center gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-amber animate-bounce-dot"
      style={{ animationDelay: delay }}
    />
  );
}
