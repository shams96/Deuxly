const CACHE_NAME = "deuxly-static-v2";
const IMAGE_CACHE_NAME = "deuxly-images-v2";
const KNOWN_CACHES = [CACHE_NAME, IMAGE_CACHE_NAME];

const STATIC_ASSETS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Wipe all caches on demand (called from the app on sign-out).
self.addEventListener("message", (event) => {
  if (event.data === "clear-cache") {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never let the service worker see or store authenticated API traffic —
  // that includes private photo bytes served from /api/photos/*/file.
  if (url.pathname.startsWith("/api/")) return;

  // Only same-origin static assets are cached.
  if (url.origin !== self.location.origin) return;

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}
