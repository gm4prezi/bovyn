import type { Tier } from "../types";

// Beta mode: all users get architect-level access
const BETA_MODE = true;

export const TIER_RANK: Record<Tier, number> = {
  trial: 0,
  intel: 1,
  operator: 2,
  execute: 3,
  architect: 4,
};

export function hasMinTier(current: Tier, min: Tier): boolean {
  if (BETA_MODE) return true;
  return TIER_RANK[current] >= TIER_RANK[min];
}

// Feature gates — post-beta tiers shown in comments
export const gates = {
  // Trial+ (available to everyone)
  fullSignalDetail: (tier: Tier) => hasMinTier(tier, "trial"),    // post-beta: trial
  realtimeSignals: (tier: Tier) => hasMinTier(tier, "trial"),     // post-beta: trial
  signalFilters: (tier: Tier) => hasMinTier(tier, "trial"),       // post-beta: trial
  positionSizer: (tier: Tier) => hasMinTier(tier, "trial"),       // post-beta: trial

  // Operator+
  goalPlanner: (tier: Tier) => hasMinTier(tier, "operator"),      // post-beta: operator
  webhooks: (tier: Tier) => hasMinTier(tier, "operator"),         // post-beta: operator
  equityCurve: (tier: Tier) => hasMinTier(tier, "operator"),      // post-beta: operator
  unlimitedAi: (tier: Tier) => hasMinTier(tier, "operator"),      // post-beta: operator

  // Execute+
  execution: (tier: Tier) => hasMinTier(tier, "execute"),         // post-beta: execute
  connectedAccounts: (tier: Tier) => hasMinTier(tier, "execute"), // post-beta: execute

  // Architect only
  algoConfig: (tier: Tier) => hasMinTier(tier, "architect"),      // post-beta: architect
};

export function signalDelayFor(_tier: Tier): {
  label: string;
  hidden: boolean;
  blurred: boolean;
  realtime: boolean;
} {
  // All tiers get real-time signals. No delays, no blurring, no hiding.
  return { label: "Real-time", hidden: false, blurred: false, realtime: true };
}

export function aiDailyLimit(tier: Tier): number | "unlimited" {
  if (tier === "trial") return 10;
  if (tier === "intel") return 25;
  return "unlimited";
}
