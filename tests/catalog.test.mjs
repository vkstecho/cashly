import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {validateManifest} from '../scripts/validate-manifest.mjs';
const initial={schemaVersion:1,channelId:null,handle:'@cashlybyVks',channelName:'Cashly',videos:[],lastSuccessfulSync:null};
const channel='UCabcdefghijabcdefghijab';
const ids=['abcdefghijk','mnopqrstuvw'];
const video=id=>({id,snippet:{channelId:channel,title:'Fixture',description:'Test',publishedAt:'2026-11-25T00:00:00Z',
  liveBroadcastContent:'none',thumbnails:{high:{url:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'}}},
  status:{uploadStatus:'processed',privacyStatus:'public',embeddable:true},contentDetails:{duration:'PT3M'}});
test('validated catalog retains no unknown keys requirement and rejects corrupt/duplicate items',()=>{
  assert.equal(validateManifest(initial),initial);
  assert.throws(()=>validateManifest({...initial,channelId:'other'}),/Invalid/);
  assert.throws(()=>validateManifest({...initial,videos:[{id:'abcdefghijk'}]}),/Invalid/);
});
test('sync paginates, ignores unchanged metadata writes, and preserves the file on failure',async()=>{
  const workspace=await mkdtemp(path.join(os.tmpdir(),'cashly-catalog-'));
  const destination=path.join(workspace,'videos.json');
  const env={...process.env},originalFetch=globalThis.fetch;
  let mode='normal',pages=0;
  try{
    await writeFile(destination,JSON.stringify(initial));
    process.env.CASHLY_CATALOG_PATH=destination;
    process.env.YOUTUBE_CHANNEL_ID=channel;
    delete process.env.YOUTUBE_API_KEY;
    const {sync,resolveChannel}=await import('../scripts/sync-youtube.mjs?fixture');
    await assert.rejects(sync,/Set YOUTUBE_API_KEY/);
    process.env.YOUTUBE_API_KEY='fixture-not-a-secret';
    globalThis.fetch=async (url, options)=>{
      assert.equal(new URL(url).searchParams.get('key'), 'fixture-not-a-secret');
      assert.equal(options.redirect, 'error');
      const endpoint=new URL(url),type=endpoint.pathname.split('/').at(-1);
      if(mode==='quota')return new Response('{}',{status:403});
      if(mode==='invalid')return Response.json({error:{status:'INVALID_ARGUMENT',message:'fixture-not-a-secret',details:[{reason:'API_KEY_INVALID'}]}},{status:400});
      if(mode==='timeout')throw new DOMException('Request timed out','TimeoutError');
      if(type==='channels'){
        if(process.env.YOUTUBE_CHANNEL_ID){assert.equal(endpoint.searchParams.get('id'),process.env.YOUTUBE_CHANNEL_ID);assert.equal(endpoint.searchParams.has('forHandle'),false);}
        else {assert.equal(endpoint.searchParams.get('forHandle').toLowerCase(),'cashlybyvks');assert.equal(endpoint.searchParams.has('id'),false);}
        return Response.json({items:[{id:channel,snippet:{title:'Cashly'},
        contentDetails:{relatedPlaylists:{uploads:'fixture'}}}]});
      }
      if(type==='playlistItems'){
        pages++;
        if(mode==='empty')return Response.json({items:[]});
        const second=endpoint.searchParams.has('pageToken');
        return Response.json({items:[{contentDetails:{videoId:ids[Number(second)]}}],nextPageToken:second?undefined:'page-2'});
      }
      if(type==='videos')return Response.json({items:ids.map(video)});
      throw Error('Unexpected endpoint');
    };
    assert.equal((await resolveChannel()).id, channel);
    delete process.env.YOUTUBE_CHANNEL_ID;
    assert.equal((await resolveChannel()).id, channel);
    process.env.YOUTUBE_CHANNEL_ID=channel;
    process.env.YOUTUBE_CHANNEL_ID = 'UC' + 'z'.repeat(22);
    await assert.rejects(sync, /creator-verified channel/);
    assert.deepEqual(JSON.parse(await readFile(destination, 'utf8')), initial);
    process.env.YOUTUBE_CHANNEL_ID = channel;
    mode = 'empty';
    await assert.rejects(sync, /requires manual approval/);
    pages = 0;
    mode = 'normal';
    await sync();assert.equal(pages,2);
    const published=await readFile(destination,'utf8');
    const catalog=validateManifest(JSON.parse(published));
    assert.equal(catalog.videos.length,2);
    assert.equal(catalog.channelId,channel);
    assert.equal(catalog.lastContentChange,catalog.lastSuccessfulSync);
    await sync();assert.equal(await readFile(destination,'utf8'),published);
    for(const failure of ['quota','invalid','timeout','empty']){
      mode=failure;await assert.rejects(sync, failure==='invalid' ? error=>error.message.includes('API_KEY_INVALID')&&!error.message.includes('fixture-not-a-secret') : undefined);
      assert.equal(await readFile(destination,'utf8'),published);
    }
    mode = 'normal';
    const older = {...catalog, lastSuccessfulSync: new Date(Date.now() - 22 * 86400000).toISOString()};
    await writeFile(destination, JSON.stringify(older));
    await sync();
    assert.deepEqual(JSON.parse(await readFile(destination, 'utf8')), older);
    older.lastSuccessfulSync = new Date(Date.now() - 24 * 86400000).toISOString();
    await writeFile(destination, JSON.stringify(older));
    await sync();
    const renewed = JSON.parse(await readFile(destination, 'utf8'));
    assert.equal(renewed.lastContentChange, catalog.lastContentChange);
    assert.ok(Date.parse(renewed.lastSuccessfulSync) > Date.parse(older.lastSuccessfulSync));
    mode = 'empty';
    process.env.ALLOW_EMPTY_CATALOG='true';
    await sync();assert.deepEqual(validateManifest(JSON.parse(await readFile(destination,'utf8'))).videos,[]);
  }finally{
    globalThis.fetch=originalFetch;
    for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];
    Object.assign(process.env,env);
    await rm(workspace,{recursive:true,force:true});
  }
});
