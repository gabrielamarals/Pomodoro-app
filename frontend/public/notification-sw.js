self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const openWindow = windows.find((client) => "focus" in client);
      if (openWindow) return openWindow.focus();
      return clients.openWindow("/");
    }),
  );
});
