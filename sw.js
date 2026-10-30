/* RAIA Chauffeur – fonctionnement hors ligne */
var VERSION = 'raia-ch-4bba0ca841';
var COQUILLE = ["./", "index.html", "manifest.webmanifest", "icone-192.png", "icone-512.png", "icone-maskable-512.png", "apple-touch-icon.png", "favicon-32.png"];
var EXTERNES = /^https:\/\/(cdn\.jsdelivr\.net|tessdata\.projectnaptha\.com)\//;
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(COQUILLE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION && k !== 'raia-ocr'; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = req.url;
  if (req.method !== 'GET') return;                       /* envois vers le serveur : jamais en cache */
  if (EXTERNES.test(url)) {                                /* lecture automatique : gardée après le 1er usage */
    e.respondWith(caches.open('raia-ocr').then(function (c) {
      return c.match(req).then(function (r) {
        return r || fetch(req).then(function (net) { if (net && (net.ok || net.type === 'opaque')) c.put(req, net.clone()); return net; });
      });
    }));
    return;
  }
  if (new URL(url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {                           /* page : réseau d'abord, sinon copie */
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (net) {
      var copie = net.clone(); caches.open(VERSION).then(function (c) { c.put('index.html', copie); }); return net;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
});
