// Hand-written service worker.
//
// This project runs on Turbopack (default bundler since Next.js 16), which does
// not support webpack plugins — so @ducanh2912/next-pwa's Workbox-based
// generation silently never ran. Turbopack still happily serves anything in
// public/ as a static file, so this worker is written by hand instead of
// generated, and is registered manually (see components/ServiceWorkerRegister.tsx).

const CACHE_NAME = 'shopmecko-v1'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  )
})

// Network-first for page navigations, falling back to the cached offline page.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
    )
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'ShopMecko', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'ShopMecko', {
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.endsWith(url) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
