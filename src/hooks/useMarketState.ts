import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMarketState, type MarketStateResponse } from "../lib/bovynApi";

const POLL_MS = 60_000; // refresh every 60s

export function useMarketState() {
  const [data, setData] = useState<MarketStateResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const doFetch = useCallback(async () => {
    try {
      const res = await fetchMarketState();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doFetch();
    timerRef.current = setInterval(doFetch, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [doFetch]);

  // Pause polling when tab is hidden
  useEffect(() => {
    function onVisibility() {
      if (document.hidden) {
        clearInterval(timerRef.current);
      } else {
        doFetch();
        timerRef.current = setInterval(doFetch, POLL_MS);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [doFetch]);

  return { data, error, loading };
}
