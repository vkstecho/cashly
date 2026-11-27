/* Versioned same-origin application shell. Public feed metadata uses its own cache. */
const CACHE = 'cashly-app-v8.1-20261127';
const SHELL = [
  'index.html', 'css/styles.css', 'js/config.js', 'js/constants.js', 'js/auth.js', 'js/sync.js', 'js/data.js',
  'js/ui-core.js', 'js/learn.js', 'js/splits.js', 'js/ui-itr.js', 'js/export.js', 'js/settings.js',
  'js/init.js', 'js/v7.js', 'js/sms-bridge.js', 'manifest.json', 'assets/icon-192.png',
  'assets/icon-512.png', 'assets/logo.jpeg', 'assets/fonts/DM-Sans.ttf', 'assets/fonts/NotoSansDevanagari.ttf'
];
const scope = new URL('./', self.location.href);
function asset(relative) { return new URL(relative, scope).href }
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(name => new Request(asset(name), {cache:"reload"})))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('cashly-app-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const relative = url.pathname.slice(scope.pathname.length);
  if (relative && !SHELL.includes(relative)) return;
  const key = asset(relative || 'index.html');
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(key)) || fetch(request)));
});
