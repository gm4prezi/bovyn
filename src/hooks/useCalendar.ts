import { useCallback, useEffect, useState } from "react";
import { fetchCalendar, type CalendarEvent } from "../lib/bovynApi";

export function useCalendar(week?: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCalendar(week);
      setEvents(res.events);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { events, loading, error, refetch: doFetch };
}
