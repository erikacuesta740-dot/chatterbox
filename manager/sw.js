/* Service worker: permite abrir el juego sin conexión una vez instalado. Solo para la versión alojada (no en el visor de claude.ai). */
const CACHE = 'mcm-v3';
const FILES = ["./", "index.html", "css/app.css", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png", "icons/icon.svg", "js/core/util.js", "js/data/leagues.js", "js/data/names.js", "js/data/values.js", "js/data/real-rosters.js", "js/engine/players.js", "js/engine/lineup.js", "js/data/generator.js", "js/engine/schedule.js", "js/engine/match.js", "js/engine/market.js", "js/engine/dev.js", "js/engine/career.js", "js/store/storage.js", "js/store/cloud.js", "js/ui/components.js", "js/app.js", "js/ui/market-ui.js"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Red primero (siempre la última versión si hay conexión); caché si no hay red.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
});
