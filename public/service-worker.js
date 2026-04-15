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
  event.waitUntil(clients.openWindow("/"));
});
