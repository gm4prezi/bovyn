import {
  Activity,
  BarChart3,
  Bell,
  Calculator,
  GitBranch,
  Newspaper,
  Palette,
  Settings as Cog,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "../ui/Logo";
import { useApp, type Screen } from "../../context/AppContext";
import { TIERS } from "../../data/tiers";
import { gates } from "../../lib/tierGates";
import { cn } from "../../lib/cn";
import { BrandCompare } from "../compare/BrandCompare";

interface DesktopNavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
}

export function TopBar() {
  const { tier, activeScreen, setActiveScreen } = useApp();
  const cfg = TIERS[tier];
  const [compareOpen, setCompareOpen] = useState(false);

  const tierBadge =
    cfg.accent === "amber"
      ? "bg-gradient-amber text-bg border-amber-300 shadow-amber-glow-sm"
      : cfg.accent === "gradient"
      ? "bg-gradient-amber text-bg border-amber-300 shadow-amber-glow-sm"
      : cfg.accent === "navy"
      ? "bg-surface-raised text-cream border-white/[0.12]"
      : cfg.accent === "teal"
      ? "bg-amber/[0.1] text-amber border-amber/30"
      : "bg-white/[0.04] text-cream/70 border-white/[0.08]";

  const desktopNav: DesktopNavItem[] = [
    { id: "signals", label: "Signals", icon: <Activity className="h-4 w-4" strokeWidth={2.25} /> },
    { id: "brief", label: "Brief", icon: <Newspaper className="h-4 w-4" strokeWidth={2.25} /> },
    { id: "ai", label: "AI", icon: <Sparkles className="h-4 w-4" strokeWidth={2.25} /> },
    { id: "chart", label: "Chart", icon: <TrendingUp className="h-4 w-4" strokeWidth={2.25} /> },
    { id: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" strokeWidth={2.25} /> },
    { id: "track-record", label: "Record", icon: <TrendingUp className="h-4 w-4" strokeWidth={2.25} /> },
    ...(gates.fullSignalDetail(tier)
      ? [{ id: "goal-planner" as const, label: "Planner", icon: <Target className="h-4 w-4" strokeWidth={2.25} /> }]
      : [{ id: "sizer" as const, label: "Sizer", icon: <Calculator className="h-4 w-4" strokeWidth={2.25} /> }]),
    ...(gates.execution(tier)
      ? [{ id: "execution" as const, label: "Execution", icon: <Zap className="h-4 w-4" strokeWidth={2.25} /> }]
      : []),
    { id: "settings", label: "Settings", icon: <Cog className="h-4 w-4" strokeWidth={2.25} /> },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-white/[0.06]"
        style={{ paddingTop: "var(--sat)" }}
      >
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-6 px-4 md:h-16 md:max-w-[1400px] md:px-8 lg:px-12">
          <Logo size="md" />

          {/* Desktop inline nav — hidden on mobile (bottom tab bar handles nav) */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {desktopNav.map((item) => {
              const active = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={cn(
                    "group relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium tracking-tight transition-all ring-focus",
                    active
                      ? "text-amber"
                      : "text-cream/60 hover:text-cream"
                  )}
                >
                  <span
                    className={cn(
                      "opacity-70 transition-opacity",
                      active && "opacity-100"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-amber shadow-amber-glow-sm" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "hidden sm:inline-flex items-center font-mono font-bold text-[10px] tracking-[0.14em] uppercase px-2.5 py-1 rounded-md border",
                tierBadge
              )}
            >
              {cfg.name}
            </span>
            {/* Fractal — launch dedicated app-in-app */}
            <button
              onClick={() => setActiveScreen("fractal")}
              aria-label="Open Fractal"
              style={{ touchAction: "manipulation" }}
              className="group relative h-11 rounded-xl bg-gradient-to-br from-amber/[0.18] to-amber/[0.06] border border-amber/40 px-2.5 flex items-center gap-1.5 text-amber hover:from-amber/[0.28] hover:to-amber/[0.10] hover:shadow-amber-glow-sm transition ring-focus"
            >
              <GitBranch className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline text-[10px] font-mono font-bold tracking-[0.18em] uppercase">
                Fractal
              </span>
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber ring-2 ring-bg animate-pulse-dot" />
            </button>
            <button
              onClick={() => setCompareOpen(true)}
              aria-label="Brand audit"
              style={{ touchAction: "manipulation" }}
              className="h-11 w-11 rounded-xl bg-amber/[0.08] border border-amber/30 flex items-center justify-center text-amber hover:bg-amber/[0.14] transition ring-focus"
            >
              <Palette className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <button
              style={{ touchAction: "manipulation" }}
              className="h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-cream/70 hover:text-amber hover:border-amber/30 transition ring-focus"
            >
              <Bell className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </header>
      {compareOpen && <BrandCompare onClose={() => setCompareOpen(false)} />}
    </>
  );
}
