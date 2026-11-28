const {chromium} = require('playwright');
const assert = require('node:assert/strict');

async function run() {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
  try {
    const base = process.env.CASHLY_TEST_URL || 'http://127.0.0.1:8765';
    const page = await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
    const now = new Date().toISOString(), requests = new Set();
    const videos = Array.from({length:29},(_,index) => {
      const id = 'fixture' + String(index).padStart(4,'0');
      return {id,title:'Video '+index,description:'Synthetic catalog',publishedAt:now,thumbnail:null,
        durationSeconds:index===2?null:60,language:index===1?'hinglish':'und',
        contentType:index===1?'short':'unknown',classificationSource:index===1?'creator-override':'unknown',
        liveStatus:index===2?'live':'none',embeddable:index!==1,watchUrl:'https://www.youtube.com/watch?v='+id};
    });
    const manifest={schemaVersion:1,handle:'@cashlybyVKS',channelId:'UC'+'x'.repeat(22),channelName:'Cashly by VKS',
      lastSuccessfulSync:now,videos,playlists:[{id:'PLFixture',title:'Creator list',description:'Ordered playlist',
        thumbnail:null,videoIds:[videos[2].id,videos[1].id]}]};
    let unavailable=false;
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      requests.add(url.hostname);
      if (url.hostname==='www.youtube-nocookie.com') return route.fulfill({body:'Official player frame fixture'});
      if (url.origin!==base) return route.abort();
      if (url.pathname==='/content/videos.json') return unavailable?route.fulfill({status:503}):route.fulfill({json:manifest});
      return route.continue();
    });
    await page.goto(base+'/videos.html');
    const cards=page.locator('#videoList .media-card');
    await cards.first().waitFor();
    assert.equal(await cards.count(),24);
    await page.getByRole('button',{name:'Load more'}).click();
    assert.equal(await cards.count(),29);
    await page.getByLabel('Content').selectOption('broadcast');
    assert.equal(await cards.count(),1);
    await page.getByText(/LIVE · last checked/).waitFor();
    await cards.first().click();
    await page.getByRole('dialog').waitFor();
    assert.match(await page.locator('iframe.cashly-video-embed').getAttribute('src'),/^https:\/\/www\.youtube-nocookie\.com\/embed\/fixture0002/);
    assert.equal(await page.getByRole('link',{name:'open in YouTube',exact:true}).getAttribute('href'),videos[2].watchUrl);
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.getByLabel('Content').selectOption('all');
    await page.getByLabel('Playlist').selectOption('PLFixture');
    assert.deepEqual(await cards.locator('h3').allTextContents(),['Video 2','Video 1']);
    await page.getByLabel('Language').selectOption('en');
    assert.equal(await cards.count(),1);
    assert.equal(await cards.first().getAttribute('href'),videos[1].watchUrl);
    await page.getByRole('searchbox',{name:'Search'}).fill('missing fixture');
    await page.getByText('No matching videos.').waitFor();
    await page.getByRole('searchbox',{name:'Search'}).fill('');
    await page.setViewportSize({width:320,height:640});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    unavailable=true;
    await page.reload();
    await page.getByText(/Showing saved catalog/).waitFor();
    assert.equal(await cards.count(),24);
    await page.evaluate(() => {
      const key='cashly_learn_catalog_v81_videos',record=JSON.parse(localStorage.getItem(key));
      record.manifest.lastSuccessfulSync=new Date(Date.now()-31*86400000).toISOString();
      localStorage.setItem(key,JSON.stringify(record));
    });
    await page.reload();
    await page.getByText(/Video catalog unavailable/).waitFor();
    assert.equal(await cards.count(),0);
    await page.goto(base+'/');
    await page.locator('#homeBlogs .media-card').first().waitFor();
    assert.ok(![...requests].some(host=>host.includes('allorigins')||host.includes('corsproxy')));
    console.log('Website accepted shared catalog, playlists, filtering, paging, framed fallback, saved and expired states, and independent blogs.');
  } finally {await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1});
