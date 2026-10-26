/* Para publicar una actualización, cambia el número de VERSION. */
const VERSION = "v3";
const CACHE = "verificador-interno-" + VERSION;
const SHELL = ["./", "index.html", "manifest.webmanifest",
  "icons/logo.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // La app: del caché primero, así abre sin conexión.
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return res;
      }).catch(() => caches.match("index.html")))
    );
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    // Tipografías: se guardan la primera vez que hay internet.
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => {
      const red = fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || red;
    })));
  }
});
