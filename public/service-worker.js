self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(clients.claim()),
);

self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.notification?.title || data.title || "Ruang Diri";
  const body = data.notification?.body || data.message || "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo/ruang-diri-logo.png",
    }),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes("/") && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow("/");
      }),
  );
});
