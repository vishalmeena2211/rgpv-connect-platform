/* global self, caches */
/*
 * RGPV Connect service worker.
 *
 * - My results opens offline: navigations are network-first, and the last
 *   good copy of each page is kept for when there is no signal.
 * - Web Push: shows results-day and message notifications and opens the
 *   right page when tapped.
 */
const PAGE_CACHE = 'rgpv-pages-v1';
const OFFLINE_PAGES = ['/results/me'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== PAGE_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !OFFLINE_PAGES.includes(url.pathname)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(url.pathname, copy));
        }
        return response;
      })
      .catch(() => caches.match(url.pathname).then((cached) => cached || Response.error())),
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'RGPV Connect', body: '', url: '/results/me', tag: undefined };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    // Plain-text pushes keep the defaults.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: '/icons/192',
      badge: '/icons/192',
      data: { url: data.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/results/me';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).pathname === target && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
