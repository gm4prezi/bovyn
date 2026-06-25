import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getAuthToken } from "../../lib/bovynApi";

export interface MockCandleChartOverlayArgs {
  priceMin: number;
  priceMax: number;
  chartWidth: number;
  chartHeight: number;
  padLeft: number;
  padTop: number;
  toY: (p: number) => number;
}

const API_URL = import.meta.env.VITE_BOVYN_API_URL ?? "https://app.bovyn.io/api";

/* ── Level scenario hints (sentence case) ───────────────── */
const LEVEL_HINT: Record<string, string> = {
  PDH:  "Breakout above = continuation. Rejection = short fade.",
  PDL:  "Hold = long setup. Breakdown = bearish continuation.",
  SH:   "Double top / fade setup or momentum break & hold.",
  SL:   "Bounce zone for longs. Break = session continuation short.",
  BSL:  "Smart money sweeps stops above → reversal south likely.",
  SSL:  "Smart money sweeps stops below → reversal north likely.",
  UEP:  "Extreme extension — strong mean reversion expected.",
  VAH:  "90% of volume below. Sellers defend — watch for rejection.",
  MGP:  "Unfilled gap — price gravitates here as intraday magnet.",
  GP:   "Minor gap fill target — price likely tags this intraday.",
  POC:  "Highest volume node — magnetic fair value level.",
  VAL:  "90% of volume above. Buyers defend — watch for bounce.",
  NECT: "Elastic target if VAH/VAL breaks — momentum continuation.",
  LEP:  "Extreme extension — strong mean reversion expected.",
};

/* ── Types ─────────────────────────────────────────────── */
interface ChartLevel {
  key: string;
  price: number;
  color: string;
  label: string;
}

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
}

/* ── Deterministic PRNG (mulberry32) ───────────────────── */
function mkRng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let s = t;
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ── Candle generation ─────────────────────────────────── */
function genCandles(center: number, spread: number, count: number, seed: number): Candle[] {
  const rng = mkRng(seed);
  const candles: Candle[] = [];
  let price = center + (rng() - 0.5) * spread * 0.4;
  for (let i = 0; i < count; i++) {
    const vol = spread * 0.025 * (0.4 + rng() * 0.9);
    const pull = (center - price) * 0.018;
    const drift = (rng() - 0.5) * 2 * vol + pull;
    const o = price;
    const c = price + drift;
    const bHi = Math.max(o, c);
    const bLo = Math.min(o, c);
    const h = bHi + rng() * vol * 0.7;
    const l = bLo - rng() * vol * 0.7;
    candles.push({ o, h, l, c });
    price = c;
  }
  return candles;
}

/* ── Time axis generation ───────────────────────────────── */
function intervalMinutes(iv: string): number {
  if (iv === "D")   return 1440;
  if (iv === "240") return 240;
  if (iv === "60")  return 60;
  return parseInt(iv, 10) || 15;
}

function genTimestamps(count: number, iv: string): Date[] {
  const mins = intervalMinutes(iv);
  // Anchor "last candle" to today at 16:00 NY
  const now = new Date();
  const base = new Date(now);
  base.setHours(16, 0, 0, 0);
  if (base > now) base.setDate(base.getDate() - 1);

  return Array.from({ length: count }, (_, i) => {
    const t = new Date(base);
    t.setMinutes(t.getMinutes() - (count - 1 - i) * mins);
    return t;
  });
}

function fmtTime(d: Date, iv: string): string {
  if (iv === "D") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/* ── Price formatter ────────────────────────────────────── */
function fmt(p: number): string {
  const d = p >= 100 ? 2 : 3;
  return p.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* ── SVG chart constants ─────────────────────────────────── */
const W        = 900;
const H        = 560;   // taller chart
const PAD_T    = 18;
const PAD_B    = 50;    // room for larger time axis labels
const PAD_L    = 4;
const PAD_R    = 72;    // right column for price labels
const CW       = W - PAD_L - PAD_R;
const CH       = H - PAD_T - PAD_B;
const N        = 50;    // fewer candles = wider bodies = readable on mobile
const N_LABELS = 6;     // fewer time axis labels to avoid crowding

/* ── Main component ─────────────────────────────────────── */
export function MockCandleChart({
  symbol,
  interval,
  renderOverlay,
}: {
  symbol: string;
  interval: string;
  /** Optional SVG overlay slot. Receives the chart's price scale. */
  renderOverlay?: (args: MockCandleChartOverlayArgs) => ReactNode;
}) {
  const [levels, setLevels] = useState<ChartLevel[]>([]);

  useEffect(() => {
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch(`${API_URL}/chart/levels?symbol=${symbol}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        const sym = data.levels?.[symbol] ?? {};
        setLevels(
          Object.entries(sym).map(([key, val]) => ({
            key,
            price: (val as { price: number }).price,
            color: (val as { color?: string }).color ?? "#F0A020",
            label: key,
          }))
        );
      })
      .catch(() => {});
  }, [symbol]);

  /* Candles + price range */
  const { candles, priceMin, priceMax } = useMemo(() => {
    const prices = levels.map((l) => l.price).filter(Boolean);
    const center = prices.length > 0 ? (Math.min(...prices) + Math.max(...prices)) / 2 : 24000;
    const lvlSpread = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : center * 0.02;
    const spread = Math.max(lvlSpread * 1.5, center * 0.006);
    const seed = hashStr(symbol + interval);
    const candles = genCandles(center, spread, N, seed);
    const allP = [...candles.flatMap((c) => [c.h, c.l]), ...prices];
    const rawMin = Math.min(...allP);
    const rawMax = Math.max(...allP);
    const pad = (rawMax - rawMin) * 0.1;
    return { candles, priceMin: rawMin - pad, priceMax: rawMax + pad };
  }, [levels, symbol, interval]);

  /* Timestamps */
  const timestamps = useMemo(() => genTimestamps(N, interval), [interval]);

  const pRange  = priceMax - priceMin;
  const toY     = (p: number) => PAD_T + CH - ((p - priceMin) / pRange) * CH;
  const candleW = CW / N;
  const bodyW   = Math.max(candleW * 0.62, 1.5);

  /* Y-axis grid */
  const gridSteps = Array.from({ length: 6 }, (_, i) => priceMin + (pRange * i) / 5);

  /* Visible levels (no overlap) */
  const visibleLevels = useMemo(() => {
    const MIN_GAP = 16;
    const sorted = [...levels].sort((a, b) => b.price - a.price);
    const shown: ChartLevel[] = [];
    for (const lvl of sorted) {
      const y = PAD_T + CH - ((lvl.price - priceMin) / pRange) * CH;
      if (y < PAD_T || y > H - PAD_B) continue;
      const clash = shown.some((s) => {
        const sy = PAD_T + CH - ((s.price - priceMin) / pRange) * CH;
        return Math.abs(sy - y) < MIN_GAP;
      });
      if (!clash) shown.push(lvl);
    }
    return shown;
  }, [levels, priceMin, pRange]);

  /* Time axis label indices — evenly spaced */
  const timeIdxs = Array.from({ length: N_LABELS }, (_, i) =>
    Math.round((i / (N_LABELS - 1)) * (N - 1))
  );

  const lastClose = candles[candles.length - 1]?.c ?? priceMin;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto block"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect width={W} height={H} fill="#0c0c0e" />

      {/* ── Horizontal grid lines ── */}
      {gridSteps.map((p, i) => (
        <line key={i}
          x1={PAD_L} y1={toY(p)} x2={W - PAD_R} y2={toY(p)}
          stroke="rgba(255,255,255,0.04)" strokeDasharray="2 8"
        />
      ))}

      {/* ── Vertical time grid lines ── */}
      {timeIdxs.map((idx) => {
        const x = PAD_L + idx * candleW + candleW / 2;
        return (
          <line key={idx}
            x1={x} y1={PAD_T} x2={x} y2={H - PAD_B}
            stroke="rgba(255,255,255,0.03)" strokeDasharray="2 6"
          />
        );
      })}

      {/* ── Real level lines ── */}
      {visibleLevels.map((lvl) => {
        const y   = toY(lvl.price);
        const hint = LEVEL_HINT[lvl.key] ?? "";
        return (
          <g key={lvl.key}>
            {/* Dashed line */}
            <line
              x1={PAD_L + 36} y1={y} x2={W - PAD_R} y2={y}
              stroke={lvl.color} strokeWidth={0.9}
              strokeDasharray="5 5" strokeOpacity={0.6}
            />
            {/* Key pill */}
            <rect
              x={PAD_L} y={y - 7.5} width={33} height={15}
              fill={`${lvl.color}22`} stroke={lvl.color}
              strokeWidth={0.5} strokeOpacity={0.4} rx={3}
            />
            <text
              x={PAD_L + 16.5} y={y + 4.5}
              textAnchor="middle" fontSize={11}
              fontFamily="'JetBrains Mono','Fira Mono',monospace"
              fontWeight="700" letterSpacing="0.04em" fill={lvl.color}
            >
              {lvl.key}
            </text>
            {/* Scenario hint */}
            {hint && (
              <text
                x={PAD_L + 42} y={y - 2.5}
                fontSize={10} fill={lvl.color} fillOpacity={0.6}
                fontFamily="ui-sans-serif,system-ui,sans-serif"
                fontStyle="italic"
              >
                {hint}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Candles ── */}
      {candles.map((c, i) => {
        const cx     = PAD_L + i * candleW + candleW / 2;
        const isUp   = c.c >= c.o;
        const col    = isUp ? "#22c55e" : "#ef4444";
        const bodyT  = toY(Math.max(c.o, c.c));
        const bodyB  = toY(Math.min(c.o, c.c));
        const bodyH  = Math.max(bodyB - bodyT, 0.8);
        return (
          <g key={i}>
            <line x1={cx} y1={toY(c.h)} x2={cx} y2={toY(c.l)}
              stroke={col} strokeWidth={0.9} strokeOpacity={0.75} />
            <rect x={cx - bodyW / 2} y={bodyT} width={bodyW} height={bodyH}
              fill={col} fillOpacity={0.88} />
          </g>
        );
      })}

      {/* ── Current price pill ── */}
      {(() => {
        const y = toY(lastClose);
        return (
          <g>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
              stroke="#F0A020" strokeWidth={0.8} strokeDasharray="2 3" strokeOpacity={0.5} />
            <rect x={W - PAD_R + 1} y={y - 9} width={PAD_R - 2} height={18}
              fill="#F0A020" rx={3} />
            <text x={W - PAD_R + (PAD_R - 2) / 2} y={y + 5}
              textAnchor="middle" fontSize={12}
              fontFamily="'JetBrains Mono','Fira Mono',monospace"
              fontWeight="700" fill="#0c0c0e"
            >
              {fmt(lastClose)}
            </text>
          </g>
        );
      })()}

      {/* ── Y-axis price labels ── */}
      {gridSteps.map((p, i) => (
        <text key={i}
          x={W - PAD_R + 5} y={toY(p) + 4}
          fontSize={14}
          fontFamily="'JetBrains Mono','Fira Mono',monospace"
          fill="rgba(255,255,255,0.55)"
        >
          {fmt(p)}
        </text>
      ))}

      {/* ── Chart right border ── */}
      <line
        x1={W - PAD_R} y1={PAD_T} x2={W - PAD_R} y2={H - PAD_B}
        stroke="rgba(255,255,255,0.07)" strokeWidth={1}
      />

      {/* ── Bottom time axis baseline ── */}
      <line
        x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B}
        stroke="rgba(255,255,255,0.07)" strokeWidth={1}
      />

      {/* ── Time axis tick marks + labels ── */}
      {timeIdxs.map((idx) => {
        const x    = PAD_L + idx * candleW + candleW / 2;
        const ts   = timestamps[idx];
        const label = ts ? fmtTime(ts, interval) : "";
        return (
          <g key={idx}>
            <line
              x1={x} y1={H - PAD_B} x2={x} y2={H - PAD_B + 4}
              stroke="rgba(255,255,255,0.15)" strokeWidth={1}
            />
            <text
              x={x} y={H - PAD_B + 17}
              textAnchor="middle" fontSize={14}
              fontFamily="'JetBrains Mono','Fira Mono',monospace"
              fill="rgba(255,255,255,0.55)"
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* ── Timeframe badge ── */}
      <rect x={PAD_L + 2} y={H - PAD_B + 26} width={38} height={18} fill="rgba(255,255,255,0.07)" rx={3} />
      <text
        x={PAD_L + 21} y={H - PAD_B + 39}
        textAnchor="middle" fontSize={12}
        fontFamily="'JetBrains Mono','Fira Mono',monospace"
        fill="rgba(255,255,255,0.5)" fontWeight="700"
      >
        {interval === "D" ? "1D" : interval === "240" ? "4H" : interval === "60" ? "1H" : `${interval}m`}
      </text>

      {/* ── Watermark ── */}
      <text
        x={W / 2} y={H / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={11}
        fontFamily="'JetBrains Mono','Fira Mono',monospace"
        fill="rgba(255,255,255,0.025)" fontWeight="900" letterSpacing="0.3em"
        transform={`rotate(-12, ${W / 2}, ${H / 2})`}
      >
        SIMULATED · REAL LEVELS
      </text>

      {/* ── Optional overlay slot (fractal zones, custom annotations) ── */}
      {renderOverlay &&
        renderOverlay({
          priceMin,
          priceMax,
          chartWidth: CW,
          chartHeight: CH,
          padLeft: PAD_L,
          padTop: PAD_T,
          toY,
        })}
    </svg>
  );
}
