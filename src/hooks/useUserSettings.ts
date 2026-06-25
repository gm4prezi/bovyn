import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchUserSettings,
  updateUserSettings,
  type UserSettingsResponse,
} from "../lib/bovynApi";

export function useUserSettings() {
  const [data, setData] = useState<UserSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserSettings(ac.signal);
      if (!ac.signal.aborted) setData(res);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!ac.signal.aborted) setError(String(e));
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const save = useCallback(
    async (patch: Partial<UserSettingsResponse>) => {
      try {
        const updated = await updateUserSettings(patch);
        setData(updated);
        return updated;
      } catch (e: unknown) {
        setError(String(e));
        return null;
      }
    },
    []
  );

  return { data, loading, error, refetch: load, save };
}
