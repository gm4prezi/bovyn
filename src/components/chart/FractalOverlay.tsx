import type { FractalResponse } from "../../types/fractal";

/**
 * SVG overlay that renders yellow boxes, pivots, sweep markers, and TP plan
 * on top of the MockCandleChart. Coordinate system matches MockCandleChart:
 *   x: PAD_L .. PAD_L + CW
 *   y: PAD_T .. PAD_T + CH
 *
 * Caller provides `toY(price)` from the parent chart's price scale.
 */
interface FractalOverlayProps {
  data: FractalResponse | null;
  priceMin: number;
  priceMax: number;
  chartWidth: number;
  chartHeight: number;
  padLeft: number;
  padTop: number;
  /** Which direction's snapshot to visualise. Default = stronger side. */
  direction?: "LONG" | "SHORT" | "AUTO";
  /** Toggle individual overlay layers. */
  layers?: {
    boxes?: boolean;
    pivots?: boolean;
    sweeps?: boolean;
    tps?: boolean;
    vector?: boolean;
  };
}

const DEFAULT_LAYERS = {
  boxes: true,
  pivots: true,
  sweeps: true,
  tps: true,
  vector: true,
};

const STATUS_FILL: Record<string, string> = {
  DEFENDED: "rgba(34, 197, 94, 0.14)",  // green
  LEAKING: "rgba(239, 68, 68, 0.14)",   // red
  UNKNOWN: "rgba(240, 160, 32, 0.10)",  // amber
  EXPIRED: "rgba(148, 163, 184, 0.06)", // slate
};

const STATUS_STROKE: Record<string, string> = {
  DEFENDED: "rgba(34, 197, 94, 0.55)",
  LEAKING: "rgba(239, 68, 68, 0.55)",
  UNKNOWN: "rgba(240, 160, 32, 0.45)",
  EXPIRED: "rgba(148, 163, 184, 0.25)",
};

export function FractalOverlay({
  data,
  priceMin,
  priceMax,
  chartWidth,
  chartHeight,
  padLeft,
  padTop,
  direction = "AUTO",
  layers = DEFAULT_LAYERS,
}: FractalOverlayProps) {
  if (!data) return null;

  const pRange = priceMax - priceMin;
  if (pRange <= 0) return null;

  const toY = (p: number): number =>
    padTop + chartHeight - ((p - priceMin) / pRange) * chartHeight;

  // Pick snapshot: explicit direction, or whichever has higher |bias_score|.
  let snap = data.long;
  if (direction === "SHORT") {
    snap = data.short;
  } else if (direction === "AUTO") {
    const l = data.long?.bias_score ?? 0;
    const s = data.short?.bias_score ?? 0;
    snap = Math.abs(l) >= Math.abs(s) ? data.long : data.short;
  }

  const xLeft = padLeft;
  const xRight = padLeft + chartWidth;

  return (
    <g pointerEvents="none" className="fractal-overlay">
      {/* ── Yellow boxes (containment zones) ───────────────── */}
      {layers.boxes && snap?.active_boxes.map((b, i) => {
        const yHi = toY(b.upper);
        const yLo = toY(b.lower);
        const fill = STATUS_FILL[b.status] ?? STATUS_FILL.UNKNOWN;
        const stroke = STATUS_STROKE[b.status] ?? STATUS_STROKE.UNKNOWN;
        return (
          <g key={`box-${i}`}>
            <rect
              x={xLeft}
              y={Math.min(yHi, yLo)}
              width={xRight - xLeft}
              height={Math.abs(yLo - yHi)}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text
              x={xRight - 4}
              y={Math.min(yHi, yLo) + 11}
              textAnchor="end"
              fontSize={9}
              fill={stroke}
              fontFamily="ui-monospace, monospace"
            >
              {`${(b.containment_prob * 100).toFixed(0)}% · n=${b.sample_n} · ${b.status}`}
            </text>
          </g>
        );
      })}

      {/* ── Pivots (fractal markers) ─────────────────────── */}
      {layers.pivots && data.pivots.map((p, i) => {
        const y = toY(p.price);
        // Approx x: confirmed pivots stretch across chart; just tag rightmost.
        const x = xRight - 6 - (i % 6) * 8;
        const color = p.kind === "HIGH" ? "#ef4444" : "#22c55e";
        return (
          <g key={`piv-${i}`}>
            <circle cx={x} cy={y} r={3} fill={color} opacity={p.confirmed ? 1 : 0.5} />
            <line
              x1={xLeft}
              y1={y}
              x2={xRight - 12}
              y2={y}
              stroke={color}
              strokeWidth={0.5}
              strokeDasharray="2 4"
              opacity={0.35}
            />
          </g>
        );
      })}

      {/* ── Recent sweeps (BSL/SSL raids) ─────────────────── */}
      {layers.sweeps && data.recent_sweeps.map((sw, i) => {
        const y = toY(sw.price);
        const color = sw.side === "BSL" ? "#f59e0b" : "#38bdf8";
        return (
          <g key={`sw-${i}`}>
            <line
              x1={xLeft}
              y1={y}
              x2={xRight}
              y2={y}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="6 2"
              opacity={0.55}
            />
            <text
              x={xLeft + 4}
              y={y - 3}
              fontSize={9}
              fill={color}
              fontFamily="ui-monospace, monospace"
              fontWeight={600}
            >
              {sw.side}
            </text>
          </g>
        );
      })}

      {/* ── TP plan (tp1/tp2/tp3 + stop) ─────────────────── */}
      {layers.tps && snap?.tp_plan && (
        <g>
          {(["tp1", "tp2", "tp3"] as const).map((k) => {
            const price = snap.tp_plan[k];
            if (!price) return null;
            const y = toY(price);
            return (
              <g key={k}>
                <line
                  x1={xLeft}
                  y1={y}
                  x2={xRight}
                  y2={y}
                  stroke="#F0A020"
                  strokeWidth={1}
                  opacity={0.8}
                />
                <text
                  x={xLeft + 4}
                  y={y - 3}
                  fontSize={9}
                  fill="#F0A020"
                  fontFamily="ui-monospace, monospace"
                  fontWeight={600}
                >
                  {k.toUpperCase()} {price.toFixed(2)}
                </text>
              </g>
            );
          })}
          {snap.tp_plan.stop != null && (
            <g>
              <line
                x1={xLeft}
                y1={toY(snap.tp_plan.stop)}
                x2={xRight}
                y2={toY(snap.tp_plan.stop)}
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="4 2"
                opacity={0.8}
              />
              <text
                x={xLeft + 4}
                y={toY(snap.tp_plan.stop) - 3}
                fontSize={9}
                fill="#ef4444"
                fontFamily="ui-monospace, monospace"
                fontWeight={600}
              >
                STOP {snap.tp_plan.stop.toFixed(2)}
              </text>
            </g>
          )}
        </g>
      )}

      {/* ── Vector arrow (bias direction) ───────────────── */}
      {layers.vector && snap?.vector && (
        <g>
          <text
            x={xLeft + 8}
            y={padTop + 14}
            fontSize={10}
            fill="#F0A020"
            fontFamily="ui-monospace, monospace"
            fontWeight={700}
          >
            {`VEC ${snap.vector.kind} ${snap.vector.direction} · conf ${(snap.vector.confidence * 100).toFixed(0)}%${
              snap.vector.historical_wr != null
                ? ` · hist ${(snap.vector.historical_wr * 100).toFixed(0)}% (n=${snap.vector.historical_n})`
                : ""
            }`}
          </text>
        </g>
      )}
    </g>
  );
}
