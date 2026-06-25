import type { MarketRead, InstrumentSymbol } from "../types";

export const MARKET_REGIME = {
  headline: "RISK ON — TRENDING",
  detail: "NY AM · Macro 09:50–10:10",
  tone: "bullish" as const,
};

export const MARKET_READS: MarketRead[] = [
  { symbol: "NQ", read: "Bullish > 21,400", bias: "bullish" },
  { symbol: "ES", read: "Correlated bullish", bias: "bullish" },
  { symbol: "YM", read: "Lagging — caution", bias: "neutral" },
  { symbol: "RTY", read: "Swept & reclaimed 2,278", bias: "bullish" },
  { symbol: "CL", read: "OB at 78.40", bias: "bullish" },
  { symbol: "GC", read: "Swept 2,400 — short setup", bias: "bearish" },
  { symbol: "SI", read: "Ranging — no setup", bias: "neutral" },
];

export const CURRENT_SESSION = "NY AM";

export const SESSIONS: { id: InstrumentSymbol | string; label: string; active: boolean }[] = [
  { id: "asia", label: "Asia", active: false },
  { id: "london", label: "London", active: false },
  { id: "nyam", label: "NY AM", active: true },
  { id: "nypm", label: "NY PM", active: false },
];
