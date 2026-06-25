import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "bovyn:install-dismissed";

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    // Show demo banner if no native prompt arrives in 1.5s (so the UX is visible in dev)
    const demoTimer = window.setTimeout(() => {
      if (!prompt) setVisible(true);
    }, 1500);

    const handler = (e: Event) => {
      e.preventDefault();
      window.clearTimeout(demoTimer);
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.clearTimeout(demoTimer);
    };
    // prompt intentionally omitted — timer is one-shot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
    }
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface border border-amber/30 shadow-amber-glow mb-4 animate-slide-up">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber/15 blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px glow-line" />
      <div className="relative flex items-center gap-3 p-3.5">
        <div className="h-10 w-10 rounded-xl bg-amber/[0.1] border border-amber/30 flex items-center justify-center flex-shrink-0">
          <Download className="h-4 w-4 text-amber" strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono font-bold tracking-[0.12em] text-amber uppercase">
            Install BOVYN
          </div>
          <div className="text-[11px] text-fog font-light mt-0.5 leading-tight">
            Add to home screen · push alerts · offline ready
          </div>
        </div>
        <button
          onClick={install}
          className="text-[10px] font-mono font-bold tracking-[0.1em] uppercase px-3 py-2 rounded-lg bg-amber text-bg shadow-amber-glow-sm hover:brightness-110 transition flex-shrink-0"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ touchAction: "manipulation" }}
          className="h-10 w-10 rounded-lg flex items-center justify-center text-fog hover:text-cream hover:bg-white/[0.04] active:bg-white/[0.08] transition flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
