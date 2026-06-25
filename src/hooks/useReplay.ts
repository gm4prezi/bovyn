import { useCallback, useEffect, useState } from "react";
import { fetchReplay, type ReplayResponse } from "../lib/bovynApi";

export function useReplay(date: string, instrument: string) {
  const [data, setData] = useState<ReplayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchReplay(date, instrument);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [date, instrument]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}
