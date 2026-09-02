const CACHE_NAME = "astrolo-v2";
const STATIC_ASSETS = ["/", "/horoscope", "/signs", "/compatibility", "/pricing", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  // Force ALL open tabs to drop the old version immediately —
  // fixes "people stuck on the old app" after an update.
  event.waitUntil(self.clients.claim().then(() =>
    self.clients.matchAll({ type: "window" }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    })
  ));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Never cache Next.js RSC payloads or build assets with versioned URLs —
  // stale RSC payloads made users navigate "old page data" without knowing.
  if (url.searchParams.has("_rsc") || url.pathname.startsWith("/_next/")) return;

  if (request.mode === "navigate") {
    // Network-first for pages: always prefer the freshest version, cache is
    // only an offline fallback. Prevents "old version at people's mobiles".
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Static assets (icons, fonts, svg): stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});