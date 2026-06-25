import type { Instrument } from "../types";

export interface SizerInputs {
  accountSize: number;
  riskPct: number;
  stopPoints: number;
  instrument: Instrument;
}

export interface SizerResult {
  /** Dollar amount being risked on the trade (account x risk%). */
  riskDollars: number;
  /** Dollar cost of the stop distance for a single contract. */
  stopCostPerContract: number;
  /** Whole number of contracts that fit inside the risk budget. */
  contracts: number;
  /** Worst-case loss if every contract is stopped out. */
  maxLoss: number;
  /** Profit at the first take-profit target (1.5R). */
  tp1Profit: number;
}

// R-multiple used for the first take-profit target.
const TP1_R_MULTIPLE = 1.5;

/**
 * Pure position-sizing math for a futures contract.
 *
 * Converts a stop distance (in points) into a per-contract dollar risk using
 * the instrument tick size and tick value, then divides the risk budget by
 * that cost to get a whole number of contracts. Contracts always round down so
 * the position never exceeds the stated risk.
 */
export function calculatePosition({
  accountSize,
  riskPct,
  stopPoints,
  instrument,
}: SizerInputs): SizerResult {
  const riskDollars = (accountSize * riskPct) / 100;
  const stopCostPerContract =
    (stopPoints / instrument.tickSize) * instrument.tickValue;
  const contracts =
    stopCostPerContract > 0 ? Math.floor(riskDollars / stopCostPerContract) : 0;
  const maxLoss = contracts * stopCostPerContract;
  const tp1Profit = contracts * stopCostPerContract * TP1_R_MULTIPLE;
  return { riskDollars, stopCostPerContract, contracts, maxLoss, tp1Profit };
}
