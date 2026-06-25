/**
 * BOVYN Fractal Engine types mirroring the Python
 * `bovyn_fractal_engine.core.types` contracts.
 *
 * Shadow mode: these snapshots are written per bar-close per direction.
 * The PWA reads the latest snapshot via GET /api/fractal?symbol=...&tf=...
 */

export type FractalDirection = "LONG" | "SHORT" | "FLAT";

export type FractalTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type FractalVectorKind =
  | "TABLETOP"
  | "SIDE_EXIT"
  | "FAIL_A"
  | "FAIL_B"
  | "FAIL_C"
  | "RETEST_HOLD"
  | "STAIRSTEP"
  | "UNKNOWN";

export type FractalPivotKind = "HIGH" | "LOW";

export type FractalZoneStatus = "DEFENDED" | "LEAKING" | "UNKNOWN" | "EXPIRED";

export interface FractalPivot {
  ts: number;
  price: number;
  kind: FractalPivotKind;
  timeframe: FractalTimeframe;
  strength: number;
  confirmed: boolean;
  confirmation_ts?: number;
}

export interface FractalYellowBox {
  upper: number;
  lower: number;
  mid: number;
  containment_prob: number;
  sample_n: number;
  status: FractalZoneStatus;
  of_confidence: number;
  anchor_ts: number;
  anchor_kind: FractalPivotKind;
}

export interface FractalVector {
  kind: FractalVectorKind;
  direction: FractalDirection;
  confidence: number;
  historical_wr: number | null;
  historical_n: number;
  bars_span: number;
}

export interface FractalWave {
  phase: string;
  bars_remaining: number;
  iv_burn_remaining: number;
  confidence: number;
}

export interface FractalGexWall {
  price: number;
  size: number;
  side: string;
}

export interface FractalTpPlan {
  tp1: number;
  tp2: number;
  tp3: number;
  stop: number;
  iv_target_range: [number, number] | null;
  atr_floor: number | null;
  gex_walls_used: FractalGexWall[];
  rationale: string;
}

export interface FractalSnapshot {
  symbol: string;
  direction: FractalDirection;
  ts: number;
  session: string;
  timeframe: FractalTimeframe;
  vector: FractalVector;
  wave: FractalWave;
  tp_plan: FractalTpPlan;
  active_boxes: FractalYellowBox[];
  bias_score: number;
  engine_version: string;
  computed_ms: number;
}

/**
 * Full payload returned from GET /api/fractal?symbol=...&tf=...
 * Includes both LONG + SHORT snapshots so the UI can render a single view.
 */
export interface FractalResponse {
  symbol: string;
  timeframe: FractalTimeframe;
  ts_last: number;
  price_last: number;
  long: FractalSnapshot | null;
  short: FractalSnapshot | null;
  pivots: FractalPivot[];
  recent_sweeps: Array<{
    ts: number;
    price: number;
    side: "BSL" | "SSL";
    confirmed: boolean;
  }>;
  engine_version: string;
}
