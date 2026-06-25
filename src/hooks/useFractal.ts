import { useEffect, useRef, useState } from "react";
import { fetchFractal } from "../lib/bovynApi";
import type { FractalResponse, FractalTimeframe } from "../types/fractal";
import type { InstrumentSymbol } from "../types";

interface UseFractalOptions {
  symbol: InstrumentSymbol;
  timeframe: FractalTimeframe;
  /** Poll interval in ms. Default 10_000. Set to 0 to disable auto-refresh. */
  pollMs?: number;
}

interface UseFractalResult {
  data: FractalResponse | null;
  loading: boolean;
  error: string | null;
  /** Manually refetch now. */
  refresh: () => void;
}

/**
 * Poll the BOVYN Fractal Engine shadow snapshot for a given symbol/TF.
 *
 * Zero impact on live signals — this hook reads the `shadow_fractal` table
 * via the backend. Safe to render alongside regular signal flows.
 */
export function useFractal({
  symbol,
  timeframe,
  pollMs = 10_000,
}: UseFractalOptions): UseFractalResult {
  const [data, setData] = useState<FractalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const refreshKey = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const resp = await fetchFractal(symbol, timeframe, ac.signal);
        if (!cancelled) {
          setData(resp);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        if ((err as DOMException)?.name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    if (pollMs > 0) {
      const id = setInterval(load, pollMs);
      return () => {
        cancelled = true;
        clearInterval(id);
        abortRef.current?.abort();
      };
    }
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
    // refreshKey.current triggers a manual refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe, pollMs, refreshKey.current]);

  return {
    data,
    loading,
    error,
    refresh: () => {
      refreshKey.current += 1;
    },
  };
}
