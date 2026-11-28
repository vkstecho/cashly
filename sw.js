/* Compatibility worker for existing registrations at the Cashly website root. */
const CACHE = "cashly-site-v2";
const ASSETS = new Set([
  "/", "/index.html", "/videos.html", "/css/site.css", "/js/blog.js", "/js/youtube.js", "/app/js/video-catalog.js",
  "/manifest.json", "/assets/cashly-icon.png", "/assets/icon-192.png",
  "/assets/icon-512.png", "/assets/icon.jpeg"
]);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...ASSETS])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.delete("cashly-v1").then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.search || !ASSETS.has(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        await cache.put(event.request, response.clone()).catch(() => {});
        return response;
      }
      return await cache.match(event.request) || response;
    } catch {
      return await cache.match(event.request) || Response.error();
    }
  }));
});
