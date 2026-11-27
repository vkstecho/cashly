import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/js/learn.js',import.meta.url),'utf8');
function learn(){
  const records=new Map();
  const ctx=vm.createContext({window:{},URL,uid:'a',DK:'fixture',localStorage:{getItem:key=>records.get(key)||null,
    setItem:(key,value)=>records.set(key,value)},document:{getElementById:()=>null},v7Icon:()=>'',esc:s=>String(s),
    v7Calcs:[['sip','SIP Calculator']]});
  vm.runInContext(source,ctx);
  return ctx;
}
const stamp=Date.now();
const date=delta=>new Date(stamp+delta).toISOString();
const manifest={schemaVersion:1,channelName:'Cashly by VKS',lastSuccessfulSync:date(0),videos:[
  {id:'abcdefghijk',title:'Confirmed Long SIP Video',contentType:'video',classificationSource:'creator-override',
    language:'hinglish',publishedAt:date(-10000),embeddable:true},
  {id:'mnopqrstuvw',title:'Quick Fixture Short',contentType:'short',language:'hi',publishedAt:date(-2000)},
  {id:'zzzzzzzzzzz',title:'Unknown Fixture Video',contentType:'unknown',language:'und',publishedAt:date(-3500)}
]};
const origin='https://cashly.vkstech.com/';
test('mixed language includes Hindi and English; unknown remains in All; chronological sorting is numeric',()=>{
  const c=learn();
  c.learnFeed.videos=c.normalizeLearn('videos',manifest,origin);
  const entries=c.learnEntries();
  assert.equal(entries.map(x=>x.title).join(','),'Quick Fixture Short,Unknown Fixture Video,Confirmed Long SIP Video');
  const featured=entries.find(x=>x.featured);
  assert.equal(featured.title,'Confirmed Long SIP Video');
  assert.deepEqual([...featured.languages],['hi','en']);
  c.learnLanguage='en';
  assert.equal(entries.filter(x=>c.learnMatches(x,'')).length,1);
  c.learnLanguage='hi';
  assert.equal(entries.filter(x=>c.learnMatches(x,'')).length,2);
  assert.equal(c.learnRelatedTools(featured)[0],'sip');
});
test('only verified eligible content is featured; Shorts appear outside latest mixed feed',()=>{
  const c=learn();
  c.learnFeed.videos=c.normalizeLearn('videos',manifest,origin);
  const markup=c.learnResults();
  assert.equal(markup.split('Confirmed Long SIP Video').length-1,1);
  assert.match(markup,/Quick Learning · Shorts/);
  assert.doesNotMatch(markup.split('Latest for you')[1],/Quick Fixture Short/);
  c.learnFeed.videos=c.learnFeed.videos.filter(x=>!x.featured);
  assert.doesNotMatch(c.learnResults(),/Featured Video/);
  c.learnFilter='short';
  assert.match(c.learnResults(),/learn-short-gallery/);
});
test('opt-in notices suppress first sync, deduplicate refresh, and isolate account state',()=>{
  const c=learn();
  c.setLearnPreference('video',true);
  const items=c.normalizeLearn('videos',manifest,origin);
  c.trackLearnItems('videos',items);
  assert.equal(c.learnAlerts().length,0);
  const newItem={...items[0],id:'video:newid123456',stamp:stamp+10000};
  c.trackLearnItems('videos',[newItem,...items]);
  c.trackLearnItems('videos',[newItem,...items]);
  assert.equal(c.learnAlerts().length,1);
  c.toggleLearnSaved(newItem.id);
  assert.equal(c.learnSaved()[0],newItem.id);
  c.uid='b';
  assert.equal(c.learnAlerts().length,0);
  assert.equal(c.learnSaved().length,0);
  assert.equal(c.learnPrefs().video,false);
});
test('expired or malformed catalog is rejected; empty catalog is a valid empty state',()=>{
  const c=learn();
  assert.throws(()=>c.acceptLearnCatalog('videos',{base:origin,manifest:{...manifest,lastSuccessfulSync:'2010-01-01'}}),/expired/);
  assert.throws(()=>c.normalizeLearn('videos',{schemaVersion:1,videos:[{}]},origin),/Invalid/);
  assert.equal(c.acceptLearnCatalog('videos',{base:origin,manifest:{...manifest,videos:[]}}).length,0);
});
