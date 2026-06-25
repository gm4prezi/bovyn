import { useCallback, useEffect, useState } from "react";
import {
  fetchAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  type AlertItem,
} from "../lib/bovynApi";

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAlerts();
      setAlerts(res.alerts);
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

  const create = useCallback(async (alert: Partial<AlertItem>) => {
    const created = await createAlert(alert);
    setAlerts((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, alert: Partial<AlertItem>) => {
    const updated = await updateAlert(id, alert);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, loading, error, refetch: doFetch, create, update, remove };
}
