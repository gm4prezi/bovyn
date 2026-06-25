import { useCallback, useEffect, useState } from "react";
import { fetchGoals, updateGoals, type GoalsResponse } from "../lib/bovynApi";

export function useGoals() {
  const [data, setData] = useState<GoalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGoals();
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

  const save = useCallback(async (goals: Partial<GoalsResponse>) => {
    const updated = await updateGoals(goals);
    setData(updated);
    return updated;
  }, []);

  return { data, loading, error, refetch: doFetch, save };
}
