import type { InstrumentSymbol, Grade, Direction } from "../types";

export interface SimAccount {
  size: number;
  label: string;
  color: string;
  currentBalance: number;
  startingBalance: number;
  totalPnl: number;
  weekPnl: number;
  resetCount: number;
  maxDrawdownAlltime: number;
  weekNumber: number;
  winRate: number;
  weekWins: number;
  weekLosses: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalReturn: number;
  maxDrawdownWeek: number;
}

export interface SimTrade {
  id: string;
  time: string;
  instrument: InstrumentSymbol;
  direction: Direction;
  grade: Grade;
  contracts: number;
  result: "TP1 Hit" | "TP2 Hit" | "TP3 Hit" | "Stopped";
  pnl: number;
}

export interface SimDay {
  date: string;
  dayLabel: string;
  trades: SimTrade[];
  dailyPnl: number;
  wins: number;
  losses: number;
}

export interface SimWeek {
  weekNumber: number;
  dateRange: string;
  pnl: number;
  hasReset: boolean;
}

export interface SimReset {
  resetNumber: number;
  date: string;
  balanceAtReset: number;
  drawdownAmount: number;
  drawdownPct: number;
  causeSummary: string;
}

export interface SimEquityPoint {
  day: number;
  date: string;
  balances: Record<number, number>; // keyed by account size
}

// ── Account palette (spec §8.3) ──
export const ACCOUNT_COLORS: Record<number, string> = {
  25000:  "#3B82F6", // blue
  50000:  "#22C55E", // green
  100000: "#E8A838", // amber
  150000: "#A855F7", // purple
};

export const ACCOUNT_SIZES = [25000, 50000, 100000, 150000] as const;

// ── Mock: 4 simulated accounts ──
export const SIM_ACCOUNTS: SimAccount[] = [
  {
    size: 25000, label: "$25K", color: "#3B82F6",
    currentBalance: 27_412, startingBalance: 25_000,
    totalPnl: 2_412, weekPnl: 847,
    resetCount: 0, maxDrawdownAlltime: 1_180,
    weekNumber: 14, winRate: 84,
    weekWins: 16, weekLosses: 3,
    avgWin: 206, avgLoss: 184,
    profitFactor: 2.8, totalReturn: 9.6,
    maxDrawdownWeek: 620,
  },
  {
    size: 50000, label: "$50K", color: "#22C55E",
    currentBalance: 54_847, startingBalance: 50_000,
    totalPnl: 4_847, weekPnl: 1_623,
    resetCount: 0, maxDrawdownAlltime: 2_400,
    weekNumber: 14, winRate: 84,
    weekWins: 16, weekLosses: 3,
    avgWin: 412, avgLoss: 368,
    profitFactor: 2.8, totalReturn: 9.7,
    maxDrawdownWeek: 1_200,
  },
  {
    size: 100000, label: "$100K", color: "#E8A838",
    currentBalance: 109_694, startingBalance: 100_000,
    totalPnl: 9_694, weekPnl: 3_246,
    resetCount: 0, maxDrawdownAlltime: 4_800,
    weekNumber: 14, winRate: 84,
    weekWins: 16, weekLosses: 3,
    avgWin: 824, avgLoss: 736,
    profitFactor: 2.8, totalReturn: 9.7,
    maxDrawdownWeek: 2_400,
  },
  {
    size: 150000, label: "$150K", color: "#A855F7",
    currentBalance: 164_541, startingBalance: 150_000,
    totalPnl: 14_541, weekPnl: 4_869,
    resetCount: 0, maxDrawdownAlltime: 7_200,
    weekNumber: 14, winRate: 84,
    weekWins: 16, weekLosses: 3,
    avgWin: 1_236, avgLoss: 1_104,
    profitFactor: 2.8, totalReturn: 9.7,
    maxDrawdownWeek: 3_600,
  },
];

// ── Mock: equity curve (14 weeks, all 4 accounts) ──
export const SIM_EQUITY: SimEquityPoint[] = [
  { day: 1,  date: "Jan 6",  balances: { 25000: 25000, 50000: 50000, 100000: 100000, 150000: 150000 } },
  { day: 5,  date: "Jan 10", balances: { 25000: 25340, 50000: 50680, 100000: 101360, 150000: 152040 } },
  { day: 10, date: "Jan 17", balances: { 25000: 25820, 50000: 51640, 100000: 103280, 150000: 154920 } },
  { day: 15, date: "Jan 24", balances: { 25000: 25480, 50000: 50960, 100000: 101920, 150000: 152880 } },
  { day: 20, date: "Jan 31", balances: { 25000: 26100, 50000: 52200, 100000: 104400, 150000: 156600 } },
  { day: 25, date: "Feb 7",  balances: { 25000: 26520, 50000: 53040, 100000: 106080, 150000: 159120 } },
  { day: 30, date: "Feb 14", balances: { 25000: 26040, 50000: 52080, 100000: 104160, 150000: 156240 } },
  { day: 35, date: "Feb 21", balances: { 25000: 26680, 50000: 53360, 100000: 106720, 150000: 160080 } },
  { day: 40, date: "Feb 28", balances: { 25000: 27100, 50000: 54200, 100000: 108400, 150000: 162600 } },
  { day: 45, date: "Mar 7",  balances: { 25000: 26780, 50000: 53560, 100000: 107120, 150000: 160680 } },
  { day: 50, date: "Mar 14", balances: { 25000: 26420, 50000: 52840, 100000: 105680, 150000: 158520 } },
  { day: 55, date: "Mar 21", balances: { 25000: 26900, 50000: 53800, 100000: 107600, 150000: 161400 } },
  { day: 60, date: "Mar 28", balances: { 25000: 27180, 50000: 54360, 100000: 108720, 150000: 163080 } },
  { day: 65, date: "Apr 4",  balances: { 25000: 27412, 50000: 54847, 100000: 109694, 150000: 164541 } },
];

// ── Mock: weekly trade log for the $50K account ──
export const SIM_TRADE_LOG: SimDay[] = [
  {
    date: "2026-04-06", dayLabel: "MONDAY — April 6",
    dailyPnl: 3390, wins: 5, losses: 0,
    trades: [
      { id: "t1", time: "09:32", instrument: "NQ", direction: "LONG",  grade: "S++", contracts: 2, result: "TP2 Hit", pnl: 895 },
      { id: "t2", time: "09:48", instrument: "ES", direction: "SHORT", grade: "A+",  contracts: 2, result: "TP1 Hit", pnl: 420 },
      { id: "t3", time: "10:15", instrument: "GC", direction: "LONG",  grade: "A+",  contracts: 3, result: "TP1 Hit", pnl: 160 },
      { id: "t4", time: "10:33", instrument: "NQ", direction: "LONG",  grade: "S++", contracts: 2, result: "TP3 Hit", pnl: 1595 },
      { id: "t5", time: "14:02", instrument: "CL", direction: "LONG",  grade: "A+",  contracts: 3, result: "TP1 Hit", pnl: 320 },
    ],
  },
  {
    date: "2026-04-05", dayLabel: "FRIDAY — April 4",
    dailyPnl: -468, wins: 2, losses: 3,
    trades: [
      { id: "t6", time: "09:35", instrument: "NQ", direction: "SHORT", grade: "A+",  contracts: 2, result: "Stopped", pnl: -380 },
      { id: "t7", time: "09:52", instrument: "ES", direction: "SHORT", grade: "A",   contracts: 2, result: "TP1 Hit", pnl: 312 },
      { id: "t8", time: "10:08", instrument: "RTY", direction: "LONG", grade: "A",   contracts: 4, result: "Stopped", pnl: -240 },
      { id: "t9", time: "13:45", instrument: "GC", direction: "SHORT", grade: "A+",  contracts: 3, result: "TP1 Hit", pnl: 280 },
      { id: "t10", time: "14:10", instrument: "CL", direction: "LONG", grade: "A",  contracts: 3, result: "Stopped", pnl: -440 },
    ],
  },
  {
    date: "2026-04-04", dayLabel: "THURSDAY — April 3",
    dailyPnl: 1420, wins: 4, losses: 1,
    trades: [
      { id: "t11", time: "09:31", instrument: "NQ", direction: "LONG", grade: "S++", contracts: 2, result: "TP2 Hit", pnl: 720 },
      { id: "t12", time: "09:50", instrument: "ES", direction: "LONG", grade: "A+",  contracts: 2, result: "TP1 Hit", pnl: 380 },
      { id: "t13", time: "10:22", instrument: "NQ", direction: "SHORT", grade: "A",  contracts: 2, result: "Stopped", pnl: -260 },
      { id: "t14", time: "13:52", instrument: "GC", direction: "SHORT", grade: "A+",  contracts: 3, result: "TP1 Hit", pnl: 310 },
      { id: "t15", time: "14:15", instrument: "CL", direction: "LONG", grade: "A+",  contracts: 3, result: "TP1 Hit", pnl: 270 },
    ],
  },
];

// ── Mock: weekly history ──
export const SIM_WEEKS: SimWeek[] = [
  { weekNumber: 14, dateRange: "Apr 6 – Apr 10", pnl: 1623, hasReset: false },
  { weekNumber: 13, dateRange: "Mar 30 – Apr 4", pnl: 2180, hasReset: false },
  { weekNumber: 12, dateRange: "Mar 23 – Mar 28", pnl: 1450, hasReset: false },
  { weekNumber: 11, dateRange: "Mar 16 – Mar 21", pnl: -3200, hasReset: true },
  { weekNumber: 10, dateRange: "Mar 9 – Mar 14", pnl: 890, hasReset: false },
  { weekNumber: 9,  dateRange: "Mar 2 – Mar 7", pnl: 1640, hasReset: false },
  { weekNumber: 8,  dateRange: "Feb 23 – Feb 28", pnl: 2100, hasReset: false },
];
