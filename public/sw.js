const CACHE = "agape-pwa-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) return;
  if (["image", "style", "font"].includes(event.request.destination)) event.respondWith(caches.open(CACHE).then(async (cache) => { const armazenado = await cache.match(event.request); if (armazenado) return armazenado; const resposta = await fetch(event.request); if (resposta.ok) cache.put(event.request, resposta.clone()); return resposta; }));
});
