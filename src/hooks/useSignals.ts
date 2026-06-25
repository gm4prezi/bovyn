/**
 * useSignals — React hook that fetches live signals from the BOVYN bot API.
 *
 * Behaviour:
 *  - On mount, fetch immediately.
 *  - Refetch on interval (default: 30s). Pauses when tab is hidden.
 *  - Exposes `signals`, `loading`, `error`, `refetch`, `live`.
 *  - If the API is not configured or fails, caller can fall back to mock data.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Signal } from "../types";
import { bovynApiConfigured, fetchSignals } from "../lib/bovynApi";

interface UseSignalsOptions {
  /** Max rows to request from the API. Default 50. */
  limit?: number;
  /** Polling interval in ms. Default 30_000. */
  intervalMs?: number;
  /** Disable auto-polling (initial fetch still runs). */
  disablePolling?: boolean;
}

interface UseSignalsResult {
  signals: Signal[];
  loading: boolean;
  error: Error | null;
  /** true once the first live fetch has returned successfully. */
  live: boolean;
  /** true if VITE_BOVYN_API_KEY is set in the build. */
  configured: boolean;
  refetch: () => void;
  /** Timestamp of last successful fetch, or null. */
  lastUpdated: Date | null;
}

export function useSignals(options: UseSignalsOptions = {}): UseSignalsResult {
  const { limit = 50, intervalMs = 30_000, disablePolling = false } = options;

  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState<boolean>(bovynApiConfigured);
  const [error, setError] = useState<Error | null>(null);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async () => {
    if (!bovynApiConfigured) {
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const fresh = await fetchSignals(limit, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setSignals(fresh);
      setLive(true);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const e = err instanceof Error ? err : new Error(String(err));
      // AbortError is expected during unmount / rapid refetch
      if (e.name === "AbortError") return;
      setError(e);
      // keep previous signals on error — prefer stale data over blank screen
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [limit]);

  // Initial fetch + polling
  useEffect(() => {
    void doFetch();
    if (disablePolling) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          void doFetch();
        }
      }, intervalMs);
    };

    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void doFetch();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
      abortRef.current?.abort();
    };
  }, [doFetch, intervalMs, disablePolling]);

  return {
    signals,
    loading,
    error,
    live,
    configured: bovynApiConfigured,
    refetch: () => void doFetch(),
    lastUpdated,
  };
}
