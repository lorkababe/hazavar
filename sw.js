// HazaVár: az oldalak mindig a legfrissebb változatból jönnek, a képek a telefonon maradnak, így gyorsan indul és net nélkül is megnyílik
const PAGES = 'hazavar-pages-v2', IMGS = 'hazavar-img-v12';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hazavar-') && k !== PAGES && k !== IMGS).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || /\.html?$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isPage) {
    // hálózat először, ha nincs net, a legutóbbi mentett változat
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(PAGES).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (/\/img\/|\.(png|jpe?g|webp|svg|mp3|ogg)$/.test(url.pathname)) {
    // képek és hangok: ami már megvan, azonnal jön, közben a háttérben frissül
    e.respondWith(caches.open(IMGS).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
// értesítésre kattintva a játék kerül előre
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => { const c = l.find(x => 'focus' in x); return c ? c.focus() : self.clients.openWindow('./'); }));
});
