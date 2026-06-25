import { useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import { SignalsScreen } from "./screens/SignalsScreen";
import { AIScreen } from "./screens/AIScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { SizerScreen } from "./screens/SizerScreen";
import { ExecutionScreen } from "./screens/ExecutionScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ChartScreen } from "./screens/ChartScreen";
import { FractalScreen } from "./screens/FractalScreen";
import { BriefScreen } from "./screens/BriefScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { JournalScreen } from "./screens/JournalScreen";
import { WeeklyReportScreen } from "./screens/WeeklyReportScreen";
import { GoalPlannerScreen } from "./screens/GoalPlannerScreen";
import { AlertBuilderScreen } from "./screens/AlertBuilderScreen";
import { ReplayScreen } from "./screens/ReplayScreen";
import { RiskDashboardScreen } from "./screens/RiskDashboardScreen";
import { WebhookScreen } from "./screens/WebhookScreen";
import { TrackRecordScreen } from "./screens/TrackRecordScreen";
import { ReferralScreen } from "./screens/ReferralScreen";
import { AdminScreen } from "./screens/AdminScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { Loader2 } from "lucide-react";

function ActiveScreen() {
  const { activeScreen } = useApp();
  switch (activeScreen) {
    case "signals":
      return <SignalsScreen />;
    case "brief":
      return <BriefScreen />;
    case "ai":
      return <AIScreen />;
    case "chart":
      return <ChartScreen />;
    case "fractal":
      return <FractalScreen />;
    case "stats":
      return <StatsScreen />;
    case "sizer":
      return <SizerScreen />;
    case "execution":
      return <ExecutionScreen />;
    case "calendar":
      return <CalendarScreen />;
    case "journal":
      return <JournalScreen />;
    case "weekly-report":
      return <WeeklyReportScreen />;
    case "goal-planner":
      return <GoalPlannerScreen />;
    case "alert-builder":
      return <AlertBuilderScreen />;
    case "replay":
      return <ReplayScreen />;
    case "risk-dashboard":
      return <RiskDashboardScreen />;
    case "webhooks":
      return <WebhookScreen />;
    case "track-record":
      return <TrackRecordScreen />;
    case "referral":
      return <ReferralScreen />;
    case "admin":
      return <AdminScreen />;
    case "settings":
      return <SettingsScreen />;
    default:
      return <SignalsScreen />;
  }
}

/** Push the tier derived from the JWT into AppContext so gates work. */
function TierSync() {
  const { user } = useAuth();
  const { tier, setTier } = useApp();
  useEffect(() => {
    if (user && user.tier !== tier) {
      setTier(user.tier);
    }
  }, [user, tier, setTier]);
  return null;
}

function BootSplash() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-bg text-cream">
      <Loader2 className="h-6 w-6 animate-spin text-amber" />
    </div>
  );
}

function AuthGate() {
  const { status } = useAuth();
  if (status === "booting") return <BootSplash />;
  if (status === "anonymous") return <LoginScreen />;
  return (
    <AppProvider>
      <TierSync />
      <AppShell>
        <ActiveScreen />
      </AppShell>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
