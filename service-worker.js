// Service worker de Marcador.
// En cada release: subir CACHE_VERSION (p. ej. 'v1' -> 'v2') para forzar
// la regeneracion del cache y la descarga de los assets nuevos.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'marcador-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './css/styles.css',
  './js/rules.js',
  './js/state.js',
  './js/storage.js',
  './js/audio.js',
  './js/timer.js',
  './js/i18n.js',
  './js/ui.js',
  './js/shortcuts.js',
  './js/pwa.js',
  './js/main.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        if (name !== CACHE_NAME) return caches.delete(name);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // externos: no cachear

  var isAsset = ASSETS.some(function (a) {
    return url.pathname.endsWith(a.replace(/^\./, ''));
  }) || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

  if (isAsset) {
    // Cache-first para assets propios
    event.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
          return res;
        });
      })
    );
  } else {
    // Network-first con fallback a cache para el resto de peticiones del origen
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req);
      })
    );
  }
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
