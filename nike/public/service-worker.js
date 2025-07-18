// Listen for push events
self.addEventListener("push", function (event) {
  const data = event.data.json();

  const options = {
    body: data.body || "You have a new update",
    icon: "/logo192.png",
    badge: "/logo192.png",
    data: {
      url: data.url || "/", // This will be used in notification click
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Notification", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.origin) && "focus" in client) {
          return client.navigate(targetUrl).then((client) => client.focus());
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

