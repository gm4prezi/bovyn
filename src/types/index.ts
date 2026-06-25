export type Tier = "trial" | "intel" | "operator" | "execute" | "architect";

export type InstrumentSymbol = "NQ" | "ES" | "YM" | "RTY" | "CL" | "GC" | "SI";

export type Grade = "S++" | "A+" | "A";

export type Direction = "LONG" | "SHORT";

export type SignalStatus =
  | "Pending"
  | "Running"
  | "TP1 Hit"
  | "TP2 Hit"
  | "TP3 Hit"
  | "Stopped"
  | "Cancelled";

export type Session = "Asia" | "London" | "NY AM" | "NY PM" | "Pre-Market" | "Off Hours";

export interface Signal {
  id: string;
  timestamp: string;
  instrument: InstrumentSymbol;
  direction: Direction;
  grade: Grade;
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  tp3: number;
  confluence: string[];
  session: Session;
  status: SignalStatus;
  pnl: number;
  gradeReasoning: string;
  source: "BOVYN" | "User Algo";
  consensusScore?: number;
  consensusLabel?: string;
  enginesFired?: string;
  signalTags?: string[];
  setupName?: string;
  engineCount?: number;
}

export interface Instrument {
  symbol: InstrumentSymbol;
  name: string;
  tickValue: number;
  tickSize: number;
  pointValue: number;
}

export interface MarketRead {
  symbol: InstrumentSymbol;
  read: string;
  bias: "bullish" | "bearish" | "neutral";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface TierConfig {
  id: Tier;
  name: string;
  price: string;
  priceNumeric: number;
  promise: string;
  accent: "slate" | "teal" | "amber" | "navy" | "gradient";
  aiQueries: number | "unlimited";
  aiLabel: string;
  signalDelay: string;
  tagline: string;
}
