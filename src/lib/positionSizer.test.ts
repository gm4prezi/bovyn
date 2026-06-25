import { describe, it, expect } from "vitest";
import { calculatePosition } from "./positionSizer";
import { INSTRUMENT_MAP } from "../data/instruments";

const NQ = INSTRUMENT_MAP.NQ; // tickSize 0.25, tickValue 5.0  -> $20 / point
const CL = INSTRUMENT_MAP.CL; // tickSize 0.01, tickValue 10.0 -> $1000 / point

describe("calculatePosition", () => {
  it("sizes NQ off a 1% risk budget and a 15 point stop", () => {
    const r = calculatePosition({
      accountSize: 100_000,
      riskPct: 1,
      stopPoints: 15,
      instrument: NQ,
    });
    // 1% of 100k = $1,000 risk budget.
    expect(r.riskDollars).toBe(1000);
    // 15 points / 0.25 tick = 60 ticks * $5 = $300 per contract.
    expect(r.stopCostPerContract).toBe(300);
    // 1000 / 300 = 3.33 -> floor to 3 contracts.
    expect(r.contracts).toBe(3);
    // 3 contracts * $300 = $900 worst-case loss.
    expect(r.maxLoss).toBe(900);
    // TP1 at 1.5R = $900 * 1.5 = $1,350.
    expect(r.tp1Profit).toBe(1350);
  });

  it("never exceeds the risk budget (rounds contracts down)", () => {
    const r = calculatePosition({
      accountSize: 100_000,
      riskPct: 1,
      stopPoints: 15,
      instrument: NQ,
    });
    expect(r.maxLoss).toBeLessThanOrEqual(r.riskDollars);
    expect(Number.isInteger(r.contracts)).toBe(true);
  });

  it("returns zero contracts when the budget is smaller than one contract", () => {
    const r = calculatePosition({
      accountSize: 1_000,
      riskPct: 0.25,
      stopPoints: 50,
      instrument: CL, // $1000/pt -> a 50pt stop costs $50,000 per contract
    });
    expect(r.contracts).toBe(0);
    expect(r.maxLoss).toBe(0);
    expect(r.tp1Profit).toBe(0);
  });

  it("guards against a zero stop distance instead of dividing by zero", () => {
    const r = calculatePosition({
      accountSize: 50_000,
      riskPct: 2,
      stopPoints: 0,
      instrument: NQ,
    });
    expect(r.stopCostPerContract).toBe(0);
    expect(r.contracts).toBe(0);
    expect(Number.isFinite(r.contracts)).toBe(true);
  });

  it("scales contract count up as the account grows", () => {
    const small = calculatePosition({
      accountSize: 50_000,
      riskPct: 1,
      stopPoints: 15,
      instrument: NQ,
    });
    const large = calculatePosition({
      accountSize: 200_000,
      riskPct: 1,
      stopPoints: 15,
      instrument: NQ,
    });
    expect(large.contracts).toBeGreaterThan(small.contracts);
  });
});
