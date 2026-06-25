import { useCallback, useEffect, useState } from "react";
import { subscribePush, unsubscribePush, fetchVapidKey } from "../lib/bovynApi";

type PushState = "unsupported" | "prompt" | "denied" | "subscribed" | "loading";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Build over an explicit ArrayBuffer so the result is a BufferSource backed
  // by ArrayBuffer (not SharedArrayBuffer), which pushManager.subscribe wants.
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    const check = async () => {
      try {
        const perm = Notification.permission;
        if (perm === "denied") {
          setState("denied");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "subscribed" : "prompt");
      } catch {
        setState("unsupported");
      }
    };

    check();
  }, []);

  const subscribe = useCallback(async () => {
    setState("loading");
    try {
      const vapidKey = await fetchVapidKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      await subscribePush(json);
      setState("subscribed");
      return true;
    } catch (err) {
      console.error("Push subscribe failed:", err);
      setState(Notification.permission === "denied" ? "denied" : "prompt");
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("prompt");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
      setState("prompt");
    }
  }, []);

  return { state, subscribe, unsubscribe };
}
