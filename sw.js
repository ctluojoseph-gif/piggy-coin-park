const CACHE = "piggy-coin-park-v3";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/main.js",
  "./js/game.js",
  "./js/data.js",
  "./js/audio.js",
  "./js/narration.js",
  "./js/voices.js",
  "./js/storage.js",
  "./js/art.js",
  "./audio/manifest.json",
  "./icons/favicon-32.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

async function addChunked(cache, urls) {
  const size = 24;
  for (let index = 0; index < urls.length; index += size) {
    await cache.addAll(urls.slice(index, index + size));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await addChunked(cache, CORE);
    const manifestUrl = new URL("./audio/manifest.json", self.location);
    const manifest = await (await fetch(manifestUrl)).json();
    const clips = Object.values(manifest.clips || {}).map((path) => new URL(path, manifestUrl).href);
    await addChunked(cache, clips);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === "opaque") return response;
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      });
    }),
  );
});
