import { useCallback, useEffect, useState } from "react";
import { fetchWeeklyReport, type WeeklyReportResponse } from "../lib/bovynApi";

export function useWeeklyReport() {
  const [data, setData] = useState<WeeklyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWeeklyReport();
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
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}
