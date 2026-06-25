import { describe, it, expect } from "vitest";
import { TIER_RANK, aiDailyLimit, signalDelayFor, gates } from "./tierGates";
import { TIER_ORDER } from "../data/tiers";

describe("TIER_RANK", () => {
  it("orders tiers strictly from trial up to architect", () => {
    expect(TIER_RANK.trial).toBeLessThan(TIER_RANK.intel);
    expect(TIER_RANK.intel).toBeLessThan(TIER_RANK.operator);
    expect(TIER_RANK.operator).toBeLessThan(TIER_RANK.execute);
    expect(TIER_RANK.execute).toBeLessThan(TIER_RANK.architect);
  });

  it("ranks every tier in the published TIER_ORDER", () => {
    const ranks = TIER_ORDER.map((t) => TIER_RANK[t]);
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });
});

describe("aiDailyLimit", () => {
  it("gives trial the smallest daily allowance", () => {
    expect(aiDailyLimit("trial")).toBe(10);
  });

  it("gives intel a larger but still capped allowance", () => {
    expect(aiDailyLimit("intel")).toBe(25);
  });

  it("treats operator and above as unlimited", () => {
    expect(aiDailyLimit("operator")).toBe("unlimited");
    expect(aiDailyLimit("execute")).toBe("unlimited");
    expect(aiDailyLimit("architect")).toBe("unlimited");
  });
});

describe("signalDelayFor", () => {
  it("returns a real-time, fully visible signal state for any tier", () => {
    const trialState = signalDelayFor("trial");
    expect(trialState.realtime).toBe(true);
    expect(trialState.hidden).toBe(false);
    expect(trialState.blurred).toBe(false);

    const architectState = signalDelayFor("architect");
    expect(architectState).toEqual(trialState);
  });
});

describe("feature gates", () => {
  it("opens the position sizer to the trial tier", () => {
    expect(gates.positionSizer("trial")).toBe(true);
  });

  it("exposes a callable gate for every advertised feature", () => {
    for (const gate of Object.values(gates)) {
      expect(typeof gate("operator")).toBe("boolean");
    }
  });
});
