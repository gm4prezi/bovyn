import { useCallback, useEffect, useState } from "react";
import {
  fetchJournal,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
} from "../lib/bovynApi";

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchJournal();
      setEntries(res.entries);
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

  const create = useCallback(async (entry: Partial<JournalEntry>) => {
    const created = await createJournalEntry(entry);
    setEntries((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, entry: Partial<JournalEntry>) => {
    const updated = await updateJournalEntry(id, entry);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteJournalEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, error, refetch: doFetch, create, update, remove };
}
