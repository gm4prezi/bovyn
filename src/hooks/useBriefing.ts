import { useCallback, useEffect, useState } from "react";
import { fetchBriefing, type BriefingResponse } from "../lib/bovynApi";

export function useBriefing(type: "am" | "eod" = "am") {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBriefing(type);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}
