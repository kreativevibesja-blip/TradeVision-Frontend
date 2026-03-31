/* ── TradeVision AI – Push Notification Service Worker ── */

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'TradeVision Alert', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: data.tag || 'tradevision-alert',
    renotify: true,
    data: {
      url: data.url || '/dashboard/scanner',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'TradeVision Alert', options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard/scanner';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(targetUrl) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
