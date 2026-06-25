import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { InstallBanner } from "./InstallBanner";
import { useApp } from "../../context/AppContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { activeScreen } = useApp();

  // Fractal is a standalone "app-in-app" — takes over the full viewport,
  // hides TopBar/BottomNav, uses its own chrome (back button in-screen).
  const bare = activeScreen === "fractal";

  if (bare) {
    return (
      <div className="min-h-[100dvh] bg-bg text-cream relative">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(240,160,32,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(240,160,32,0.05) 0%, transparent 60%)",
          }}
        />
        {children}
      </div>
    );
  }

  return (
    /* No overflow-hidden on root — iOS Safari blocks touch events on fixed
       children (BottomNav) when parent has overflow:hidden. */
    <div className="min-h-[100dvh] bg-bg text-cream relative">
      {/* Ambient aurora backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(240,160,32,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(240,160,32,0.04) 0%, transparent 60%)",
        }}
      />
      <TopBar />
      <main
        className="relative mx-auto w-full max-w-lg px-4 pt-4 pb-[calc(6rem+var(--sab))] overflow-x-hidden md:max-w-[1400px] md:px-8 md:pt-8 md:pb-16 lg:px-12"
      >
        <InstallBanner />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
