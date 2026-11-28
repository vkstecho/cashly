const {chromium} = require('playwright');
const {readFileSync} = require('node:fs');
const {createServer} = require('node:http');
const assert = require('node:assert/strict');

(async () => {
  let updated = false;
  let home = 'original website';
  const worker = readFileSync('sw.js', 'utf8');
  const server = createServer((request, response) => {
    if (request.url === '/sw.js') {
      response.setHeader('Content-Type', 'application/javascript');
      response.setHeader('Cache-Control', 'no-store');
      response.end(updated ? worker : `
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
      `);
    } else {
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end(request.url === '/' ? home : 'network ' + request.url);
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(origin);
    await page.evaluate(async () => {
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const oldSite = await caches.open('cashly-v1');
      await oldSite.put('/', new Response('old landing'));
      const app = await caches.open('cashly-app-v8.1-youtube-20261128');
      await app.put('/app/', new Response('saved app shell'));
      localStorage.setItem('cashly-root-worker-fixture', 'keep this draft');
    });
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    updated = true;
    home = 'updated website';
    await page.evaluate(async () => {
      const changed = new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once:true}));
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      await changed;
    });
    await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
    const outcome = await page.evaluate(async () => {
      const cache = await caches.open('cashly-site-v2');
      for (const path of ['/app/', '/content/videos.json', '/blog/manifest.json']) {
        await cache.put(path, new Response('stale fixture'));
      }
      const paths = ['/', '/app/', '/content/videos.json', '/blog/manifest.json'];
      return {keys: (await caches.keys()).sort(),
        draft:localStorage.getItem('cashly-root-worker-fixture'),
        appShell:await (await (await caches.open('cashly-app-v8.1-youtube-20261128')).match('/app/')).text(),
        responses: await Promise.all(paths.map(async path => (await fetch(path)).text()))};
    });
    assert.deepEqual(outcome.keys, ['cashly-app-v8.1-youtube-20261128', 'cashly-site-v2']);
    assert.equal(outcome.draft, 'keep this draft');
    assert.equal(outcome.appShell, 'saved app shell');
    assert.deepEqual(outcome.responses, ['updated website','network /app/','network /content/videos.json','network /blog/manifest.json']);
    await context.setOffline(true);
    assert.equal(await page.evaluate(async () => (await fetch('/')).text()), 'updated website');
    console.log('Root worker upgrade, scoped cache cleanup, app and catalog passthrough, and offline landing recovery passed.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
