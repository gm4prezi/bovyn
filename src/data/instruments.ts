import type { Instrument } from "../types";

export const INSTRUMENTS: Instrument[] = [
  { symbol: "NQ", name: "Nasdaq 100", tickValue: 5.0, tickSize: 0.25, pointValue: 20 },
  { symbol: "ES", name: "S&P 500", tickValue: 12.5, tickSize: 0.25, pointValue: 50 },
  { symbol: "YM", name: "Dow Jones", tickValue: 5.0, tickSize: 1.0, pointValue: 5 },
  { symbol: "RTY", name: "Russell 2000", tickValue: 5.0, tickSize: 0.1, pointValue: 50 },
  { symbol: "CL", name: "Crude Oil", tickValue: 10.0, tickSize: 0.01, pointValue: 1000 },
  { symbol: "GC", name: "Gold", tickValue: 10.0, tickSize: 0.1, pointValue: 100 },
  { symbol: "SI", name: "Silver", tickValue: 25.0, tickSize: 0.005, pointValue: 5000 },
];

export const INSTRUMENT_MAP = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, i])
) as Record<Instrument["symbol"], Instrument>;
