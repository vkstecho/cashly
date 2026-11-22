/* Cashly app-only offline shell. Never cache user data, auth or API responses. */
const CACHE = 'cashly-app-v5-learn';
const SHELL = ['index.html','css/styles.css','js/config.js','js/constants.js','js/auth.js','js/data.js','js/ui-core.js','js/learn.js','js/ui-itr.js','js/export.js','js/settings.js','js/init.js','js/sms-bridge.js','manifest.json','assets/icon-192.png','assets/icon-512.png','assets/logo.jpeg'];
const SCOPE = new URL('./',self.location.href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.all(SHELL.map(async path=>{try{await cache.add(new URL(path,SCOPE).href)}catch(e){console.warn('Cashly offline asset unavailable:',path)}}));await self.skipWaiting()})));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cashly-app-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE.pathname))return;
 const relative=url.pathname.slice(SCOPE.pathname.length);
 if(relative && !SHELL.includes(relative))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(req.mode==='navigate'||relative==='index.html'||relative===''){
   try{const response=await fetch(req);if(response.ok)await cache.put(new URL('index.html',SCOPE).href,response.clone());return response}
   catch(e){return (await cache.match(new URL('index.html',SCOPE).href))||Response.error()}
  }
  const hit=await cache.match(req);if(hit)return hit;
  try{const response=await fetch(req);if(response.ok)await cache.put(req,response.clone());return response}catch(e){return Response.error()}
 })());
});
