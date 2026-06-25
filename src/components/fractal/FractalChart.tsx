import { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "../../lib/bovynApi";
import type { FractalResponse } from "../../types/fractal";

/**
 * FractalChart — cinematic, full-bleed candle theatre.
 *
 * Not a box. Not a widget. The chart IS the room.
 * Layers (back→front):
 *   0 · atmospheric radial gradient + scanline
 *   1 · session ribbon (Asia / London / NY blocks)
 *   2 · heat-map volume profile emerging from right edge
 *   3 · level horizon lines with right-edge price flags
 *   4 · Yellow Boxes (Fractal containment zones) as glowing translucent slabs
 *   5 · Liquidity columns (stops above swept highs, below swept lows)
 *   6 · Candles — smart-coloured by absorption / distribution
 *   7 · Wave projection cone fanning from last close into the future
 *   8 · Sweep arrows on swept pivots
 *   9 · Last-price pulse (radiating ring) + amber flag
 */

const API_URL = import.meta.env.VITE_BOVYN_API_URL ?? "https://app.bovyn.io/api";

interface ChartLevel {
  key: string;
  price: number;
  color: string;
}

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  /** rough delta in [-1, 1] — positive = bull absorption */
  d: number;
}

/* ── deterministic RNG ─────────────────────────────────── */
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

/* ── candle gen with volume + delta ─────────────────────── */
function genCandles(center: number, spread: number, count: number, seed: number): Candle[] {
  const rng = mkRng(seed);
  const out: Candle[] = [];
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
    const v = 0.3 + rng() * 0.7;
    // Delta biased toward move direction with some noise
    const d = Math.tanh((c - o) / vol) * (0.6 + rng() * 0.6);
    out.push({ o, h, l, c, v, d });
    price = c;
  }
  return out;
}

/* ── time axis ─────────────────────────────────────────── */
function intervalMinutes(iv: string): number {
  if (iv === "1h" || iv === "60") return 60;
  if (iv === "4h" || iv === "240") return 240;
  if (iv === "1d" || iv === "D") return 1440;
  return parseInt(iv, 10) || 15;
}

function genTimestamps(count: number, iv: string): Date[] {
  const mins = intervalMinutes(iv);
  const now = new Date();
  const base = new Date(now);
  base.setSeconds(0, 0);
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(base);
    t.setMinutes(t.getMinutes() - (count - 1 - i) * mins);
    return t;
  });
}

function fmtTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function fmt(p: number): string {
  const d = p >= 1000 ? 1 : p >= 100 ? 2 : 3;
  return p.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** NY session block for a given Date. */
function sessionOf(d: Date): "ASIA" | "LON" | "NY" | "OFF" {
  const ny = d.getUTCHours() - 4; // rough ET offset
  const h = (ny + 24) % 24;
  if (h >= 2 && h < 8) return "LON";
  if (h >= 8 && h < 16) return "NY";
  if (h >= 18 || h < 2) return "ASIA";
  return "OFF";
}

const SESSION_TONE: Record<string, string> = {
  ASIA: "rgba(139, 92, 246, 0.18)",
  LON: "rgba(56, 189, 248, 0.18)",
  NY: "rgba(240, 160, 32, 0.22)",
  OFF: "rgba(255, 255, 255, 0.04)",
};

/* ── geometry ──────────────────────────────────────────── */
const W = 1600;
const H = 900;
const N = 96;           // more candles = sharper
const VP_W = 180;       // volume profile width on right
const FLAG_W = 84;      // price flag column on far right
const RIBBON_H = 22;    // session ribbon on bottom
const TIME_H = 16;      // time tick strip

const CHART_RIGHT = W - VP_W - FLAG_W;
const CHART_BOTTOM = H - RIBBON_H - TIME_H;

/* ══════════════════════════════════════════════════════════ */
export function FractalChart({
  symbol,
  interval,
  fractal,
  direction = "AUTO",
  layers = { boxes: true, pivots: true, sweeps: true, tps: true, liquidity: true, waves: true, profile: true },
  beat = 0,
}: {
  symbol: string;
  interval: string;
  fractal: FractalResponse | null;
  direction?: "LONG" | "SHORT" | "AUTO";
  layers?: {
    boxes?: boolean;
    pivots?: boolean;
    sweeps?: boolean;
    tps?: boolean;
    liquidity?: boolean;
    waves?: boolean;
    profile?: boolean;
  };
  /** heartbeat counter so last-candle pulse ticks */
  beat?: number;
}) {
  const [levels, setLevels] = useState<ChartLevel[]>([]);

  /* fetch real level set */
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
          }))
        );
      })
      .catch(() => {});
  }, [symbol]);

  /* candles + scale */
  const { candles, priceMin, priceMax } = useMemo(() => {
    const prices = levels.map((l) => l.price).filter(Boolean);
    const center = prices.length > 0 ? (Math.min(...prices) + Math.max(...prices)) / 2 : 24000;
    const lvlSpread = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : center * 0.02;
    const spread = Math.max(lvlSpread * 1.7, center * 0.008);
    const seed = hashStr(symbol + interval);
    const cs = genCandles(center, spread, N, seed);
    const allP = [...cs.flatMap((c) => [c.h, c.l]), ...prices];
    const rawMin = Math.min(...allP);
    const rawMax = Math.max(...allP);
    const pad = (rawMax - rawMin) * 0.12;
    return { candles: cs, priceMin: rawMin - pad, priceMax: rawMax + pad };
  }, [levels, symbol, interval]);

  const timestamps = useMemo(() => genTimestamps(N, interval), [interval]);

  const pRange = priceMax - priceMin;
  const toY = (p: number) => ((priceMax - p) / pRange) * CHART_BOTTOM;
  const candleW = CHART_RIGHT / N;
  const bodyW = Math.max(candleW * 0.58, 1.8);

  const lastCandle = candles[candles.length - 1];
  const lastClose = lastCandle?.c ?? priceMin;
  const lastX = CHART_RIGHT - candleW / 2;

  /* volume profile buckets */
  const profile = useMemo(() => {
    const buckets = 40;
    const step = pRange / buckets;
    const rows = Array.from({ length: buckets }, () => ({ up: 0, dn: 0 }));
    for (const c of candles) {
      const mid = (c.h + c.l) / 2;
      const idx = Math.min(buckets - 1, Math.max(0, Math.floor((mid - priceMin) / step)));
      if (c.c >= c.o) rows[idx].up += c.v;
      else rows[idx].dn += c.v;
    }
    const max = rows.reduce((m, r) => Math.max(m, r.up + r.dn), 1e-9);
    return rows.map((r, i) => ({
      yTop: toY(priceMin + (i + 1) * step),
      yBot: toY(priceMin + i * step),
      frac: (r.up + r.dn) / max,
      bullShare: r.up / (r.up + r.dn || 1),
    }));
  }, [candles, priceMin, pRange]);

  /* de-overlap levels */
  const visibleLevels = useMemo(() => {
    const MIN_GAP = 18;
    const sorted = [...levels].sort((a, b) => b.price - a.price);
    const shown: ChartLevel[] = [];
    for (const lvl of sorted) {
      const y = toY(lvl.price);
      if (y < 0 || y > CHART_BOTTOM) continue;
      if (shown.some((s) => Math.abs(toY(s.price) - y) < MIN_GAP)) continue;
      shown.push(lvl);
    }
    return shown;
  }, [levels, priceMin, pRange]);

  /* grid / time labels */
  const gridSteps = Array.from({ length: 7 }, (_, i) => priceMin + (pRange * i) / 6);
  const timeIdxs = Array.from({ length: 8 }, (_, i) => Math.round((i / 7) * (N - 1)));

  /* session ribbon runs */
  const sessionRuns = useMemo(() => {
    const runs: Array<{ x0: number; x1: number; s: string }> = [];
    let curr = "";
    let start = 0;
    for (let i = 0; i < timestamps.length; i++) {
      const s = sessionOf(timestamps[i]);
      if (s !== curr) {
        if (curr) runs.push({ x0: start * candleW, x1: i * candleW, s: curr });
        curr = s;
        start = i;
      }
    }
    if (curr) runs.push({ x0: start * candleW, x1: N * candleW, s: curr });
    return runs;
  }, [timestamps]);

  /* snapshot selection */
  const snap = (() => {
    if (!fractal) return null;
    if (direction === "LONG") return fractal.long;
    if (direction === "SHORT") return fractal.short;
    const l = fractal.long?.bias_score ?? 0;
    const s = fractal.short?.bias_score ?? 0;
    return Math.abs(l) >= Math.abs(s) ? fractal.long : fractal.short;
  })();

  /* wave projection cone — last 3 candles trajectory */
  const waveCone = useMemo(() => {
    if (!snap || !snap.tp_plan) return null;
    const tail = candles.slice(-4);
    if (tail.length < 2) return null;
    const slope = (tail[tail.length - 1].c - tail[0].c) / tail.length;
    const bars = 24;
    const originX = lastX;
    const originY = toY(lastClose);
    // three targets
    const tps = [snap.tp_plan.tp1, snap.tp_plan.tp2, snap.tp_plan.tp3].filter(Boolean);
    if (!tps.length) return null;
    return {
      originX,
      originY,
      endX: originX + bars * candleW,
      // fan ±slope*3 at the end
      spread: Math.max(Math.abs(slope) * bars, pRange * 0.02),
      tps: tps.map((tp) => ({ price: tp, y: toY(tp) })),
      dir: snap.direction,
    };
  }, [candles, snap, pRange]);

  /* sweep markers */
  const sweeps = fractal?.recent_sweeps ?? [];

  /* liquidity pools: columns above pivots.HIGH and below pivots.LOW that haven't been swept */
  const liquidity = useMemo(() => {
    if (!fractal) return [];
    const cols: Array<{ price: number; side: "ABOVE" | "BELOW"; strength: number }> = [];
    for (const p of fractal.pivots.slice(0, 8)) {
      cols.push({
        price: p.price,
        side: p.kind === "HIGH" ? "ABOVE" : "BELOW",
        strength: p.strength,
      });
    }
    return cols;
  }, [fractal]);

  /* pulse radius driven by beat */
  const pulseR = 6 + (beat % 20);
  const pulseO = 1 - (beat % 20) / 22;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-full w-full block"
    >
      <defs>
        {/* radial atmospheric glow behind chart */}
        <radialGradient id="fc-atmos" cx="50%" cy="0%" r="95%">
          <stop offset="0%" stopColor="rgba(240,160,32,0.16)" />
          <stop offset="40%" stopColor="rgba(240,160,32,0.04)" />
          <stop offset="100%" stopColor="rgba(10,10,14,0)" />
        </radialGradient>
        <linearGradient id="fc-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(10,10,14,0)" />
          <stop offset="100%" stopColor="rgba(240,160,32,0.08)" />
        </linearGradient>
        {/* wave cone gradient */}
        <linearGradient id="fc-wave-up" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(34,197,94,0.34)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0)" />
        </linearGradient>
        <linearGradient id="fc-wave-dn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(239,68,68,0.34)" />
          <stop offset="100%" stopColor="rgba(239,68,68,0)" />
        </linearGradient>
        <linearGradient id="fc-liq-up" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.28)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0)" />
        </linearGradient>
        <linearGradient id="fc-liq-dn" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(245,158,11,0.28)" />
          <stop offset="100%" stopColor="rgba(245,158,11,0)" />
        </linearGradient>
        {/* yellow box slab */}
        <linearGradient id="fc-box" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(240,160,32,0.02)" />
          <stop offset="45%" stopColor="rgba(240,160,32,0.18)" />
          <stop offset="55%" stopColor="rgba(240,160,32,0.18)" />
          <stop offset="100%" stopColor="rgba(240,160,32,0.02)" />
        </linearGradient>
        {/* scanline */}
        <pattern id="fc-scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,255,255,0.012)" strokeWidth="1" />
        </pattern>
        {/* crosshair glow filter */}
        <filter id="fc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Layer 0 · atmosphere */}
      <rect width={W} height={H} fill="#08080a" />
      <rect width={W} height={H} fill="url(#fc-atmos)" />
      <rect x="0" y={CHART_BOTTOM * 0.66} width={CHART_RIGHT} height={CHART_BOTTOM * 0.34} fill="url(#fc-floor)" />
      <rect width={W} height={H} fill="url(#fc-scan)" />

      {/* crosshair grid */}
      {gridSteps.map((p, i) => (
        <line
          key={`gy-${i}`}
          x1={0}
          y1={toY(p)}
          x2={CHART_RIGHT}
          y2={toY(p)}
          stroke="rgba(255,255,255,0.035)"
          strokeDasharray="2 12"
        />
      ))}
      {timeIdxs.map((idx) => (
        <line
          key={`gx-${idx}`}
          x1={idx * candleW + candleW / 2}
          y1={0}
          x2={idx * candleW + candleW / 2}
          y2={CHART_BOTTOM}
          stroke="rgba(255,255,255,0.025)"
          strokeDasharray="2 10"
        />
      ))}

      {/* Layer 1 · session ribbon */}
      {sessionRuns.map((r, i) => (
        <g key={`sr-${i}`}>
          <rect
            x={r.x0}
            y={CHART_BOTTOM + TIME_H}
            width={r.x1 - r.x0}
            height={RIBBON_H}
            fill={SESSION_TONE[r.s]}
          />
          {r.x1 - r.x0 > 60 && (
            <text
              x={(r.x0 + r.x1) / 2}
              y={CHART_BOTTOM + TIME_H + RIBBON_H / 2 + 3.5}
              textAnchor="middle"
              fontSize="10"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
              letterSpacing="0.24em"
              fill="rgba(255,255,255,0.38)"
            >
              {r.s}
            </text>
          )}
        </g>
      ))}

      {/* Layer 2 · volume profile (emerges from right edge inward) */}
      {layers.profile && profile.map((row, i) => {
        const widthPx = row.frac * VP_W;
        if (widthPx < 0.5) return null;
        const upCol = "rgba(240,160,32,0.55)";
        const dnCol = "rgba(120,80,16,0.45)";
        // split bar: bull portion from outer right inward, bear above it
        const bullW = widthPx * row.bullShare;
        const bearW = widthPx * (1 - row.bullShare);
        return (
          <g key={`vp-${i}`}>
            <rect
              x={CHART_RIGHT + VP_W - bullW}
              y={row.yTop + 1}
              width={bullW}
              height={Math.max(row.yBot - row.yTop - 2, 1)}
              fill={upCol}
            />
            <rect
              x={CHART_RIGHT + VP_W - bullW - bearW}
              y={row.yTop + 1}
              width={bearW}
              height={Math.max(row.yBot - row.yTop - 2, 1)}
              fill={dnCol}
            />
          </g>
        );
      })}
      {/* VP divider */}
      <line
        x1={CHART_RIGHT}
        y1={0}
        x2={CHART_RIGHT}
        y2={CHART_BOTTOM}
        stroke="rgba(240,160,32,0.12)"
      />

      {/* Layer 3 · real level horizons + right-edge flags */}
      {visibleLevels.map((lvl) => {
        const y = toY(lvl.price);
        return (
          <g key={`lv-${lvl.key}`}>
            <line
              x1={0}
              y1={y}
              x2={CHART_RIGHT}
              y2={y}
              stroke={lvl.color}
              strokeWidth={0.8}
              strokeDasharray="5 6"
              strokeOpacity={0.45}
            />
            {/* label at left */}
            <rect x={8} y={y - 8} width={36} height={16} fill={`${lvl.color}1a`} stroke={lvl.color} strokeOpacity={0.35} rx={3} />
            <text
              x={26}
              y={y + 4}
              textAnchor="middle"
              fontSize={10}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={700}
              fill={lvl.color}
            >
              {lvl.key}
            </text>
            {/* price flag far right */}
            <polygon
              points={`${CHART_RIGHT + VP_W},${y} ${CHART_RIGHT + VP_W + 8},${y - 9} ${W - 2},${y - 9} ${W - 2},${y + 9} ${CHART_RIGHT + VP_W + 8},${y + 9}`}
              fill={`${lvl.color}26`}
              stroke={lvl.color}
              strokeOpacity={0.7}
            />
            <text
              x={CHART_RIGHT + VP_W + (FLAG_W) / 2 + 4}
              y={y + 4}
              textAnchor="middle"
              fontSize={11}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={700}
              fill={lvl.color}
            >
              {fmt(lvl.price)}
            </text>
          </g>
        );
      })}

      {/* Layer 4 · Yellow Boxes */}
      {layers.boxes && snap?.active_boxes.map((b, i) => {
        const yHi = toY(b.upper);
        const yLo = toY(b.lower);
        const top = Math.min(yHi, yLo);
        const h = Math.abs(yLo - yHi);
        return (
          <g key={`yb-${i}`}>
            <rect
              x={0}
              y={top}
              width={CHART_RIGHT}
              height={h}
              fill="url(#fc-box)"
            />
            <rect
              x={0}
              y={top}
              width={CHART_RIGHT}
              height={h}
              fill="none"
              stroke="rgba(240,160,32,0.55)"
              strokeWidth={0.8}
              strokeDasharray="8 5"
            />
            <text
              x={CHART_RIGHT - 10}
              y={top + 14}
              textAnchor="end"
              fontSize={10}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={700}
              fill="rgba(240,160,32,0.85)"
            >
              {`YB ${(b.containment_prob * 100).toFixed(0)}% · n=${b.sample_n} · ${b.status}`}
            </text>
          </g>
        );
      })}

      {/* Layer 5 · liquidity columns */}
      {layers.liquidity && liquidity.map((pool, i) => {
        const y = toY(pool.price);
        const w = Math.max(4, 6 * pool.strength);
        const x = CHART_RIGHT - 36 - i * 16;
        if (pool.side === "ABOVE") {
          return (
            <rect
              key={`lq-${i}`}
              x={x - w / 2}
              y={0}
              width={w}
              height={Math.max(y - 6, 0)}
              fill="url(#fc-liq-up)"
            />
          );
        }
        return (
          <rect
            key={`lq-${i}`}
            x={x - w / 2}
            y={y + 6}
            width={w}
            height={Math.max(CHART_BOTTOM - y - 6, 0)}
            fill="url(#fc-liq-dn)"
          />
        );
      })}

      {/* Layer 6 · candles with smart colour */}
      {candles.map((c, i) => {
        const cx = i * candleW + candleW / 2;
        const up = c.c >= c.o;
        // Absorption = strong bull delta closing green → amber
        // Distribution = strong bear delta closing red → crimson
        const absorbing = up && c.d > 0.55;
        const distributing = !up && c.d < -0.55;
        const col = absorbing
          ? "#F0A020"
          : distributing
            ? "#dc2626"
            : up
              ? "#2dd4bf"
              : "#ef4444";
        const bodyT = toY(Math.max(c.o, c.c));
        const bodyB = toY(Math.min(c.o, c.c));
        const bodyH = Math.max(bodyB - bodyT, 1);
        const opacity = 0.55 + c.v * 0.45;
        return (
          <g key={`k-${i}`}>
            {/* volume shadow behind candle */}
            <rect
              x={cx - candleW / 2 + 1}
              y={CHART_BOTTOM - c.v * 80}
              width={candleW - 2}
              height={c.v * 80}
              fill={col}
              fillOpacity={0.05}
            />
            <line
              x1={cx}
              y1={toY(c.h)}
              x2={cx}
              y2={toY(c.l)}
              stroke={col}
              strokeWidth={1}
              strokeOpacity={opacity * 0.7}
            />
            <rect
              x={cx - bodyW / 2}
              y={bodyT}
              width={bodyW}
              height={bodyH}
              fill={col}
              fillOpacity={opacity}
            />
            {absorbing && (
              <rect
                x={cx - bodyW / 2 - 1}
                y={bodyT - 1}
                width={bodyW + 2}
                height={bodyH + 2}
                fill="none"
                stroke="#F0A020"
                strokeOpacity={0.55}
                strokeWidth={0.6}
              />
            )}
          </g>
        );
      })}

      {/* Layer 7 · wave projection cone */}
      {layers.waves && waveCone && (() => {
        const { originX, originY, endX, spread, tps, dir } = waveCone;
        const grad = dir === "LONG" ? "fc-wave-up" : dir === "SHORT" ? "fc-wave-dn" : "fc-wave-up";
        const endHi = originY - spread;
        const endLo = originY + spread;
        return (
          <g>
            <polygon
              points={`${originX},${originY} ${endX},${endHi} ${endX},${endLo}`}
              fill={`url(#${grad})`}
            />
            {/* central trajectory */}
            <line
              x1={originX}
              y1={originY}
              x2={endX}
              y2={originY - (dir === "LONG" ? spread * 0.4 : dir === "SHORT" ? -spread * 0.4 : 0)}
              stroke="rgba(240,160,32,0.45)"
              strokeWidth={1.2}
              strokeDasharray="4 4"
            />
            {/* TP beacons at end */}
            {tps.map((tp, i) => (
              <g key={`tp-${i}`}>
                <line
                  x1={originX}
                  y1={tp.y}
                  x2={endX}
                  y2={tp.y}
                  stroke="#F0A020"
                  strokeOpacity={0.65}
                  strokeWidth={0.8}
                  strokeDasharray="6 4"
                />
                <circle cx={endX} cy={tp.y} r={4.5} fill="#F0A020" />
                <text
                  x={endX - 10}
                  y={tp.y - 6}
                  textAnchor="end"
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={700}
                  fill="#F0A020"
                >
                  {`TP${i + 1} ${fmt(tp.price)}`}
                </text>
              </g>
            ))}
          </g>
        );
      })()}

      {/* Layer 8 · sweeps */}
      {layers.sweeps && sweeps.map((sw, i) => {
        const y = toY(sw.price);
        const col = sw.side === "BSL" ? "#f59e0b" : "#38bdf8";
        return (
          <g key={`sw-${i}`}>
            <line
              x1={0}
              y1={y}
              x2={CHART_RIGHT}
              y2={y}
              stroke={col}
              strokeWidth={1}
              strokeDasharray="4 3"
              strokeOpacity={0.5}
            />
            <polygon
              points={`${CHART_RIGHT - 18},${y} ${CHART_RIGHT - 6},${y - 5} ${CHART_RIGHT - 6},${y + 5}`}
              fill={col}
            />
            <text
              x={8}
              y={y - 3}
              fontSize={10}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={700}
              fill={col}
            >
              {sw.side} SWEPT
            </text>
          </g>
        );
      })}

      {/* Layer 9 · last-price pulse + flag */}
      {(() => {
        const y = toY(lastClose);
        return (
          <g filter="url(#fc-glow)">
            <circle cx={lastX} cy={y} r={pulseR} fill="none" stroke="#F0A020" strokeOpacity={pulseO} strokeWidth={1.2} />
            <circle cx={lastX} cy={y} r={3} fill="#F0A020" />
            <line x1={0} y1={y} x2={CHART_RIGHT + VP_W} y2={y} stroke="#F0A020" strokeWidth={0.9} strokeDasharray="2 3" strokeOpacity={0.55} />
            <polygon
              points={`${CHART_RIGHT + VP_W},${y} ${CHART_RIGHT + VP_W + 10},${y - 11} ${W - 2},${y - 11} ${W - 2},${y + 11} ${CHART_RIGHT + VP_W + 10},${y + 11}`}
              fill="#F0A020"
            />
            <text
              x={CHART_RIGHT + VP_W + FLAG_W / 2 + 4}
              y={y + 4.5}
              textAnchor="middle"
              fontSize={13}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={800}
              fill="#0a0a0e"
            >
              {fmt(lastClose)}
            </text>
          </g>
        );
      })()}

      {/* Time strip */}
      {timeIdxs.map((idx) => {
        const x = idx * candleW + candleW / 2;
        const ts = timestamps[idx];
        return (
          <g key={`t-${idx}`}>
            <line x1={x} y1={CHART_BOTTOM} x2={x} y2={CHART_BOTTOM + 4} stroke="rgba(255,255,255,0.2)" />
            <text
              x={x}
              y={CHART_BOTTOM + 13}
              textAnchor="middle"
              fontSize={10}
              fontFamily="'JetBrains Mono', monospace"
              fill="rgba(255,255,255,0.5)"
              letterSpacing="0.1em"
            >
              {ts ? fmtTime(ts) : ""}
            </text>
          </g>
        );
      })}

      {/* Bottom baseline */}
      <line x1={0} y1={CHART_BOTTOM} x2={CHART_RIGHT + VP_W} y2={CHART_BOTTOM} stroke="rgba(255,255,255,0.1)" />

      {/* Watermark (only when offline / empty) */}
      {!fractal && (
        <g>
          <text
            x={CHART_RIGHT / 2}
            y={CHART_BOTTOM / 2 + 4}
            textAnchor="middle"
            fontSize={22}
            fontFamily="'Instrument Serif', 'Playfair Display', serif"
            fill="rgba(240,160,32,0.18)"
            letterSpacing="0.1em"
            fontStyle="italic"
          >
            awaiting shadow feed
          </text>
          <text
            x={CHART_RIGHT / 2}
            y={CHART_BOTTOM / 2 + 32}
            textAnchor="middle"
            fontSize={10}
            fontFamily="'JetBrains Mono', monospace"
            fill="rgba(240,160,32,0.32)"
            letterSpacing="0.35em"
          >
            FRACTAL_ICT_SHADOW=1 · BOVYN ENGINE
          </text>
        </g>
      )}
    </svg>
  );
}
