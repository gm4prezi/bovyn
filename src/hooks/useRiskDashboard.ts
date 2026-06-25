import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRiskDashboard, type RiskDashboardResponse } from "../lib/bovynApi";

const POLL_MS = 15_000; // refresh every 15s for risk data

export function useRiskDashboard() {
  const [data, setData] = useState<RiskDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const doFetch = useCallback(async () => {
    try {
      const res = await fetchRiskDashboard();
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

  return { data, loading, error, refetch: doFetch };
}
