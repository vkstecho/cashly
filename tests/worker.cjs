const {chromium}=require('playwright');
const {readFileSync}=require('node:fs');
const {createServer}=require('node:http');
const assert=require('node:assert/strict');

(async()=>{
  const workerV81=readFileSync('app/sw.js','utf8');
  let release='v8',broken=false;
  const server=createServer((request,response)=>{
    const file=new URL(request.url,'http://localhost').pathname;
    if(file==='/app/sw.js'){
      response.setHeader('Content-Type','application/javascript');
      response.setHeader('Cache-Control','no-store');
      response.end(release==='v8'?workerV81.replace('cashly-app-v8.1-youtube-20261128','cashly-app-fixture-v8'):workerV81);
    }else if(file==='/app/'||file==='/app/index.html'){
      response.setHeader('Content-Type','text/html');
      response.end('<!doctype html><html><body><div id="release">'+release+'</div></body></html>');
    }else if(broken&&file==='/app/js/sync.js'){
      response.writeHead(503);response.end('Asset unavailable');
    }else if(file.startsWith('/app/'))response.end(release);
    else{response.writeHead(404);response.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  try {
    const context=await browser.newContext();
    const a=await context.newPage(),b=await context.newPage();
    await a.goto(base+'/app/');
    await a.evaluate(async()=>{
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
    });
    await a.waitForFunction(()=>navigator.serviceWorker.controller);
    await b.goto(base+'/app/');
    await b.waitForFunction(()=>navigator.serviceWorker.controller);

    const shell=async page=>page.evaluate(async()=>[
      (await (await fetch('./index.html')).text()).match(/id="release">(.*?)</)[1],
      await (await fetch('./js/data.js')).text()
    ]);
    assert.deepEqual(await shell(a),['v8','v8']);
    release='v81';broken=true;
    await a.evaluate(async()=>{
      const registration=await navigator.serviceWorker.ready;
      const failed=new Promise(resolve=>registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker.addEventListener('statechange',()=>{if(worker.state==='redundant')resolve();});
      },{once:true}));
      await Promise.all([registration.update(),failed]);
    });
    assert.deepEqual(await shell(a),['v8','v8']);
    assert.deepEqual(await shell(b),['v8','v8']);
    broken=false;
    await a.evaluate(async()=>{
      const registration=await navigator.serviceWorker.ready;
      const waiting=new Promise(resolve=>registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker.addEventListener('statechange',()=>{if(worker.state==='installed')resolve();});
      },{once:true}));
      await Promise.all([registration.update(),waiting]);
    });
    assert.deepEqual(await shell(b),['v8','v8']);
    await a.close();await b.close();
    const c=await context.newPage();
    await c.goto(base+'/app/');
    await c.waitForFunction(async()=>navigator.serviceWorker.controller
      &&(await (await fetch('./js/data.js')).text())==='v81');
    assert.deepEqual(await shell(c),['v81','v81']);
    console.log('Two-tab service worker upgrade and interrupted install passed');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
