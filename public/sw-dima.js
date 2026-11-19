// Service Worker mínimo para PWA Dima (instalable + offline básico)
const CACHE_NAME = 'dima-v1'
const ASSETS = ['/dima', '/dima-manifest.json', '/dima-icon.svg', '/logo.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // Ignora peticiones no GET
  if (request.method !== 'GET') return
  // Ignora peticiones a la API
  if (request.url.includes('/api/')) return
  // Network-first con fallback a cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/dima')))
  )
})
