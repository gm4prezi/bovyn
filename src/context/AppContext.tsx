import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Tier } from "../types";

interface AppState {
  tier: Tier;
  setTier: (t: Tier) => void;
  activeScreen: Screen;
  setActiveScreen: (s: Screen) => void;
  aiQueriesUsed: number;
  incrementAiQueries: () => void;
  resetAiQueries: () => void;
  accountSize: number;
  setAccountSize: (s: number) => void;
  riskPct: number;
  setRiskPct: (p: number) => void;
}

export type Screen =
  | "signals"
  | "brief"
  | "ai"
  | "chart"
  | "fractal"
  | "stats"
  | "sizer"
  | "execution"
  | "calendar"
  | "journal"
  | "weekly-report"
  | "goal-planner"
  | "alert-builder"
  | "replay"
  | "risk-dashboard"
  | "webhooks"
  | "track-record"
  | "referral"
  | "admin"
  | "settings";

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier>("operator");
  const [activeScreen, setActiveScreen] = useState<Screen>("signals");
  const [aiQueriesUsed, setAiQueriesUsed] = useState(0);
  const [accountSize, setAccountSize] = useState(50000);
  const [riskPct, setRiskPct] = useState(1.5);

  const value = useMemo<AppState>(
    () => ({
      tier,
      setTier,
      activeScreen,
      setActiveScreen,
      aiQueriesUsed,
      incrementAiQueries: () => setAiQueriesUsed((n) => n + 1),
      resetAiQueries: () => setAiQueriesUsed(0),
      accountSize,
      setAccountSize,
      riskPct,
      setRiskPct,
    }),
    [tier, activeScreen, aiQueriesUsed, accountSize, riskPct]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
