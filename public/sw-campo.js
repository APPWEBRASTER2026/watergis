// Service Worker de WATERGIS Campo — permite que la app cargue
// aunque no haya señal, y guarda una copia local de la pantalla principal.

const CACHE_NAME = "watergis-campo-v1";
const URLS_A_GUARDAR = ["/campo", "/manifest-campo.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_A_GUARDAR))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: para las páginas propias de /campo, primero intenta la red;
// si falla (sin señal), sirve la copia guardada. Las llamadas a /api/*
// nunca se cachean — esas las maneja la cola offline del lado del cliente.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return; // dejar pasar tal cual

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
