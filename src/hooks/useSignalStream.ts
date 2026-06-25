import { useEffect, useRef, useCallback } from "react";
import { createSignalStream } from "../lib/bovynApi";

/**
 * SSE hook for real-time signal updates.
 * Falls back gracefully if the stream endpoint is unavailable.
 */
export function useSignalStream(
  onSignal: (data: Record<string, unknown>) => void,
  onMarket?: (data: Record<string, unknown>) => void
) {
  const esRef = useRef<EventSource | null>(null);
  const onSignalRef = useRef(onSignal);
  const onMarketRef = useRef(onMarket);
  onSignalRef.current = onSignal;
  onMarketRef.current = onMarket;

  const connect = useCallback(() => {
    esRef.current?.close();
    esRef.current = createSignalStream(
      (data) => onSignalRef.current(data),
      onMarketRef.current ? (data) => onMarketRef.current?.(data) : undefined
    );
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  return {
    reconnect: connect,
    close: () => {
      esRef.current?.close();
      esRef.current = null;
    },
  };
}
