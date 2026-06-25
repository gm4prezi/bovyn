/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { registerRoute, NavigationRoute, createHandlerBoundToURL } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope;

// ── Workbox caching ─────────────────────────────────────────────
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

// ── Push Notifications ──────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: {
    title: string;
    body: string;
    tag?: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
    actions?: Array<{ action: string; title: string }>;
  };

  try {
    payload = event.data.json();
  } catch {
    payload = { title: "BOVYN", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag ?? "bovyn-signal",
      icon: payload.icon ?? "/icons/icon.svg",
      badge: payload.badge ?? "/icons/icon.svg",
      data: payload.data ?? {},
      actions: payload.actions ?? [],
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })
  );
});

// Clicking a notification opens the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data?.url as string) ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          client.focus();
          if ("navigate" in client) {
            (client as WindowClient).navigate(url);
          }
          return;
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(url);
    })
  );
});
