/* Service worker: permite abrir el juego sin conexión una vez instalado. Solo para la versión alojada (no en el visor de claude.ai). */
const CACHE = 'mcm-v13';
const FILES = ["./", "index.html", "css/app.css", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png", "icons/icon.svg", "js/core/util.js", "js/data/leagues.js", "js/data/names.js", "js/data/values.js", "js/data/real-rosters.js", "js/data/rosters/eng2.js", "js/data/rosters/esp2.js", "js/data/rosters/euro.js", "js/data/rosters/fra1.js", "js/data/rosters/ger1.js", "js/data/rosters/ita1.js", "js/data/world/arg1.js", "js/data/world/aus1.js", "js/data/world/aut1.js", "js/data/world/bel1.js", "js/data/world/den1.js", "js/data/world/eng3.js", "js/data/world/eng4.js", "js/data/world/fra2.js", "js/data/world/ger2.js", "js/data/world/ger3.js", "js/data/world/irl1.js", "js/data/world/ita2.js", "js/data/world/kor1.js", "js/data/world/ksa1.js", "js/data/world/ned1.js", "js/data/world/nor1.js", "js/data/world/pol1.js", "js/data/world/por1.js", "js/data/world/rou1.js", "js/data/world/sco1.js", "js/data/world/sui1.js", "js/data/world/swe1.js", "js/data/world/tur1.js", "js/data/world/usa1.js", "js/engine/players.js", "js/engine/lineup.js", "js/data/generator.js", "js/engine/schedule.js", "js/engine/match.js", "js/engine/comps.js", "js/engine/market.js", "js/engine/dev.js", "js/engine/manager.js", "js/engine/life.js", "js/engine/career.js", "js/engine/online.js", "js/store/storage.js", "js/store/cloud.js", "js/vendor/peerjs.min.js", "js/store/online-sync.js", "js/store/p2p-rooms.js", "js/ui/components.js", "js/app.js", "js/ui/season-ui.js", "js/ui/market-ui.js", "js/ui/career-ui.js", "js/ui/life-ui.js", "js/ui/online-ui.js", "js/ui/celebrate.js"];
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
