import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createYouTubeApi} from '../scripts/youtube-api.mjs';
import {resolveChannel,sync} from '../scripts/sync-youtube.mjs';
import {validateManifest} from '../scripts/validate-manifest.mjs';

const channel = 'UC' + 'x'.repeat(22), other = 'UC' + 'z'.repeat(22);
const ids = {long:'abcdefghijk',short:'mnopqrstuvw',recorded:'rec00000001',upcoming:'upc00000001',live:'liv00000001',gone:'gone0000001',foreign:'for00000001'};
const uploads = 'UUfixture', shorts = 'PLShorts', series = 'PLSeries';
const key = 'fixture-key-only';
const base = {schemaVersion:1,handle:'@cashlybyVks',channelName:'Cashly',channelId:null,lastSuccessfulSync:null,videos:[]};
const channelItem = {id:channel,snippet:{title:'Cashly by VKS'},contentDetails:{relatedPlaylists:{uploads}}};
const item = id => ({contentDetails:{videoId:id}});
const metadata = id => ({
  id,snippet:{channelId:id===ids.foreign?other:channel,channelTitle:'Cashly by VKS',title:'Video '+id,description:'Public description',
    thumbnails:{high:{url:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'}},publishedAt:'2026-11-27T08:10:00+05:30',
    defaultLanguage:'hi',defaultAudioLanguage:'en-US',categoryId:'27',tags:['finance'],
    liveBroadcastContent:id===ids.upcoming?'upcoming':id===ids.live?'live':'none'},
  status:{privacyStatus:'public',uploadStatus:'processed',embeddable:true},
  contentDetails:{duration:id===ids.upcoming?'PT0S':id===ids.live?'':'PT1H2M3S'},
  liveStreamingDetails:id===ids.upcoming?{scheduledStartTime:'2026-12-10T04:00:00Z'}:id===ids.live
    ?{actualStartTime:'2026-11-27T04:00:00Z'}:id===ids.recorded
    ?{actualStartTime:'2026-11-25T04:00:00Z',actualEndTime:'2026-11-25T05:00:00Z'}:undefined
});

test('API auth failures, invalid criteria, disabled and restricted keys, quota, and retries give safe diagnostics', async () => {
  for (const [status,reason] of [[400,'invalidCriteria'],[400,'API_KEY_INVALID'],[403,'SERVICE_DISABLED'],[403,'API_KEY_SERVICE_BLOCKED'],
    [403,'API_KEY_HTTP_REFERRER_BLOCKED'],[403,'API_KEY_IP_ADDRESS_BLOCKED'],[403,'quotaExceeded']]) {
    let attempts = 0;
    const api = createYouTubeApi(key,{fetcher:async url => {
      attempts++;
      assert.equal(url.origin,'https://www.googleapis.com');
      assert.equal(url.searchParams.get('key'), key);
      return Response.json({error:{message:'Message with ' + key,details:[{reason},{reason:key}]}},{status});
    }});
    await assert.rejects(api.request('channels',{id:channel,part:'snippet,contentDetails'}),
      {message:'channels returned HTTP '+status+' ('+reason+')'});
    assert.equal(attempts,1);
  }
  const retries=[];
  const timed=createYouTubeApi(key,{fetcher:async () => {throw new DOMException('URL '+key,'TimeoutError')},
    wait:async ms=>retries.push(ms)});
  await assert.rejects(timed.request('channels',{}), {message:'channels TIMEOUT'});
  assert.deepEqual(retries,[500,1000]);
  let attempt=0;
  const transient=createYouTubeApi(key,{fetcher:async ()=>++attempt===1?new Response('',{status:429}):Response.json({items:[]}),wait:async()=>{}});
  assert.deepEqual((await transient.request('videos',{})).items,[]);
  const malformed=createYouTubeApi(key,{fetcher:async()=>Response.json({unexpected:'echo '+key})});
  await assert.rejects(malformed.request('videos',{}), {message:'videos MALFORMED_RESPONSE'});
});

test('channel lookup uses one filter at a time and independently confirms handle and uploads', async () => {
  const filters = [];
  const api = createYouTubeApi(key,{fetcher:async url=>{
    filters.push([...url.searchParams.keys()].filter(name=>name==='id'||name==='forHandle'));
    assert.equal(url.searchParams.get('part'),'snippet,contentDetails');
    return Response.json({items:[channelItem]});
  }});
  assert.equal((await resolveChannel(api,channel)).contentDetails.relatedPlaylists.uploads,uploads);
  assert.deepEqual(filters,[['id'],['forHandle']]);
  const wrong = createYouTubeApi(key,{fetcher:async url=>Response.json({items:[{
    ...channelItem,id:url.searchParams.has('forHandle')?other:channel
  }]})});
  await assert.rejects(resolveChannel(wrong,channel),/CHANNEL_IDENTITY_MISMATCH/);
  const absent = createYouTubeApi(key,{fetcher:async()=>Response.json({items:[]})});
  await assert.rejects(resolveChannel(absent,channel),/CHANNEL_NOT_FOUND/);
});

test('complete sync reconciles uploads, playlists, livestreams and creator classifications atomically', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(),'cashly-youtube-'));
  const catalogFile = path.join(dir,'videos.json'), overridesFile = path.join(dir,'overrides.json');
  let mode = 'normal';
  const endpoints = [];
  const api = () => createYouTubeApi(key,{fetcher:async url=>{
    const params = url.searchParams;
    const endpoint = url.pathname.split('/').at(-1);
    endpoints.push([endpoint,params.get('pageToken'),params.get('id')]);
    const page = (items,nextPageToken,totalResults) => Response.json({items,nextPageToken,pageInfo:{totalResults}});
    if (endpoint==='channels') return page([{...channelItem,snippet:{...channelItem.snippet,customUrl:'@cashlybyvks'}}]);
    if (endpoint==='search') return page([{id:{videoId:params.get('eventType')==='live'?ids.live:ids.upcoming}}]);
    if (endpoint==='playlists') {
      const group=id=>({id,snippet:{channelId:channel,title:id,description:'Creator playlist'},status:{privacyStatus:'public'},contentDetails:{itemCount:3}});
      return params.has('pageToken')?page([group(series)],undefined,2):page([group(shorts)],'playlist_page_2',2);
    }
    if (endpoint==='playlistItems') {
      const playlist = params.get('playlistId');
      if (playlist===uploads) {
        if (mode==='partial') return page([item(ids.long)],undefined,6);
        if (mode==='malformed') return Response.json({error:'unexpected'});
        return params.has('pageToken')?page([item(ids.long),item(ids.recorded),item(ids.gone)],undefined,6)
          :page([item(ids.long),item(ids.short),item(ids.foreign)],'upload_page_2',6);
      }
      return page((playlist===shorts?[ids.short,ids.short,ids.foreign]:[ids.recorded,ids.long,ids.gone]).map(item));
    }
    assert.equal(endpoint,'videos');
    assert.match(params.get('part'),/liveStreamingDetails/);
    return page(mode==='empty'?[]:params.get('id').split(',').filter(id=>mode!=='removed'||id!==ids.gone).map(metadata));
  },wait:async()=>{}});
  try {
    await writeFile(catalogFile,JSON.stringify(base));
    await writeFile(overridesFile,JSON.stringify({[ids.long]:{language:'hinglish',contentType:'video',tools:['sip'],tags:['reviewed']}}));
    const options = {expected:channel,catalogFile,overridesFile,shortsPlaylist:shorts};
    assert.equal(await sync({...options,api:api()}),true);
    const bytes = await readFile(catalogFile,'utf8');
    const catalog = validateManifest(JSON.parse(bytes));
    assert.ok(endpoints.some(([name,token])=>name==='playlistItems'&&token==='upload_page_2'));
    assert.ok(endpoints.some(([name,token])=>name==='playlists'&&token==='playlist_page_2'));
    assert.equal(catalog.videos.length,6);
    const byId = Object.fromEntries(catalog.videos.map(v=>[v.id,v]));
    assert.equal(byId[ids.long].publishedAt,'2026-11-27T02:40:00.000Z');
    assert.equal(byId[ids.long].durationSeconds,3723);
    assert.deepEqual(byId[ids.long].tags,['finance','reviewed']);
    assert.equal(byId[ids.long].language,'hinglish');
    assert.equal(byId[ids.short].contentType,'short');
    assert.equal(byId[ids.upcoming].durationSeconds,0);
    assert.equal(byId[ids.upcoming].liveStatus,'upcoming');
    assert.equal(byId[ids.live].durationSeconds,null);
    assert.equal(byId[ids.live].liveStatus,'live');
    assert.equal(byId[ids.recorded].liveStatus,'recorded');
    assert.deepEqual(catalog.playlists.find(p=>p.id===shorts).videoIds,[ids.short]);
    assert.deepEqual(catalog.playlists.find(p=>p.id===series).videoIds,[ids.recorded,ids.long,ids.gone]);
    assert.ok(!byId[ids.foreign]);
    const invalid = structuredClone(catalog);
    invalid.playlists[0].videoIds.push(ids.foreign);
    assert.throws(()=>validateManifest(invalid),/Invalid/);
    assert.throws(()=>validateManifest({...catalog,videos:[catalog.videos[0],catalog.videos[0]]}),/Invalid/);
    assert.equal(await sync({...options,api:api()}),false);
    for (mode of ['partial','malformed','empty']) {
      await assert.rejects(sync({...options,api:api()}));
      assert.equal(await readFile(catalogFile,'utf8'),bytes);
    }
    mode='removed';
    await sync({...options,api:api(),previousPublication:'2026-11-27T10:00:00Z'});
    const removed=validateManifest(JSON.parse(await readFile(catalogFile,'utf8')));
    assert.equal(removed.videos.length,5);
    assert.ok(!removed.playlists.find(p=>p.id===series).videoIds.includes(ids.gone));
    assert.equal(removed.lastSuccessfulPublication,'2026-11-27T10:00:00.000Z');
    assert.deepEqual((await readdir(dir)).sort(),['overrides.json','videos.json']);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
