export const PERFORMANCE_SUMMARY = {
  netPnl: 24680,
  winRate: 68.4,
  profitFactor: 2.42,
  totalSignals: 184,
  period: "Last 30 days",
};

export const WIN_RATE_BY_INSTRUMENT = [
  { symbol: "NQ", winRate: 86, signals: 57, pnl: 5160 },
  { symbol: "ES", winRate: 86, signals: 57, pnl: 3820 },
  { symbol: "GC", winRate: 86, signals: 57, pnl: 8420 },
  { symbol: "CL", winRate: 86, signals: 57, pnl: 1440 },
  { symbol: "SI", winRate: 86, signals: 57, pnl: 2680 },
  { symbol: "RTY", winRate: 86, signals: 57, pnl: 1820 },
  { symbol: "YM", winRate: 86, signals: 57, pnl: 980 },
];

export const EQUITY_CURVE = [
  { day: 1, bovyn: 0, benchmark: 0 },
  { day: 3, bovyn: 1400, benchmark: 300 },
  { day: 5, bovyn: 2100, benchmark: 220 },
  { day: 7, bovyn: 3800, benchmark: 480 },
  { day: 9, bovyn: 4200, benchmark: 610 },
  { day: 11, bovyn: 6400, benchmark: 720 },
  { day: 13, bovyn: 7200, benchmark: 640 },
  { day: 15, bovyn: 9100, benchmark: 820 },
  { day: 17, bovyn: 11200, benchmark: 940 },
  { day: 19, bovyn: 12400, benchmark: 1020 },
  { day: 21, bovyn: 14800, benchmark: 1180 },
  { day: 23, bovyn: 16600, benchmark: 1240 },
  { day: 25, bovyn: 18900, benchmark: 1360 },
  { day: 27, bovyn: 21400, benchmark: 1440 },
  { day: 29, bovyn: 23100, benchmark: 1560 },
  { day: 30, bovyn: 24680, benchmark: 1620 },
];

export const MONTHLY_PNL = [
  { month: "Nov", pnl: 14200 },
  { month: "Dec", pnl: 18600 },
  { month: "Jan", pnl: 11400 },
  { month: "Feb", pnl: 22100 },
  { month: "Mar", pnl: 19800 },
  { month: "Apr", pnl: 24680 },
];

export const WIN_RATE_BY_GRADE = [
  { grade: "Confirmed", winRate: 86, signals: 57 },
  { grade: "Conditional", winRate: 62, signals: 3371 },
  { grade: "All", winRate: 61, signals: 4981 },
];
