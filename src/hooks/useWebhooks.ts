import { useCallback, useEffect, useState } from "react";
import {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  type WebhookItem,
} from "../lib/bovynApi";

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWebhooks();
      setWebhooks(res.webhooks);
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

  const create = useCallback(async (wh: Partial<WebhookItem>) => {
    const created = await createWebhook(wh);
    setWebhooks((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, wh: Partial<WebhookItem>) => {
    const updated = await updateWebhook(id, wh);
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteWebhook(id);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const test = useCallback(async (id: string) => {
    return testWebhook(id);
  }, []);

  return { webhooks, loading, error, refetch: doFetch, create, update, remove, test };
}
