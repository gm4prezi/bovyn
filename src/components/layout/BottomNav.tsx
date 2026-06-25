import {
  Activity,
  Sparkles,
  BarChart3,
  Calculator,
  Target,
  Zap,
  Settings as Cog,
  TrendingUp,
  Newspaper,
} from "lucide-react";
import type { Screen } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";
import { gates } from "../../lib/tierGates";
import { cn } from "../../lib/cn";

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  notification?: boolean;
}

export function BottomNav() {
  const { tier, activeScreen, setActiveScreen } = useApp();

  const items: NavItem[] = [
    { id: "signals", label: "Signals", icon: <Activity className="h-5 w-5" />, notification: true },
    { id: "brief", label: "Brief", icon: <Newspaper className="h-5 w-5" /> },
    { id: "ai", label: "AI", icon: <Sparkles className="h-5 w-5" /> },
    { id: "chart", label: "Chart", icon: <TrendingUp className="h-5 w-5" /> },
    { id: "stats", label: "Stats", icon: <BarChart3 className="h-5 w-5" /> },
    ...(gates.fullSignalDetail(tier)
      ? [{ id: "goal-planner" as const, label: "Planner", icon: <Target className="h-5 w-5" /> }]
      : [{ id: "sizer" as const, label: "Sizer", icon: <Calculator className="h-5 w-5" /> }]),
    ...(gates.execution(tier)
      ? [{ id: "execution" as const, label: "Exec", icon: <Zap className="h-5 w-5" /> }]
      : []),
    { id: "settings", label: "Settings", icon: <Cog className="h-5 w-5" /> },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-xl border-t border-white/[0.06] md:hidden"
      style={{ paddingBottom: "var(--sab)" }}
    >
      <div className="max-w-lg mx-auto px-2">
        <div className={cn("flex items-center justify-around py-1", items.length === 6 && "px-0")}>
          {items.map((item) => {
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                style={{ touchAction: "manipulation" }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-2 py-3 rounded-xl transition-all flex-1 min-w-0 ring-focus min-h-[48px]",
                  active ? "text-amber" : "text-fog hover:text-cream"
                )}
              >
                <div className="relative">
                  {active && (
                    <div className="absolute inset-0 -m-2 rounded-full bg-amber/20 blur-lg" />
                  )}
                  <div className="relative">{item.icon}</div>
                  {item.notification && active === false && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber ring-2 ring-bg animate-pulse-dot z-[1]" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-[0.04em]",
                    active && "font-bold"
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-8 bg-amber rounded-full shadow-amber-glow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
