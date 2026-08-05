/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

/**
 * Runway service worker — handles offline caching, installability,
 * and push notifications for bill reminders.
 */
installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // Disable telemetry
  disableDevLogs: true,
});

/**
 * Push notification handler — for bill reminders and savings nudges.
 * Requires subscription stored server-side (Phase 6).
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, url, tag } = data;

    event.waitUntil(
      self.registration.showNotification(title ?? "Runway", {
        body: body ?? "You have a new notification",
        icon: "/icon-192.png",
        badge: "/icon-192-maskable.png",
        tag: tag ?? "runway-notification",
        data: { url: url ?? "/" },
        requireInteraction: false,
      }),
    );
  } catch (err) {
    console.error("Push event error:", err);
  }
});

/**
 * Notification click handler — opens the app to the relevant route.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if found
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
