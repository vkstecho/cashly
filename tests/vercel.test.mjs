import assert from 'node:assert/strict';
import {test} from 'node:test';
import {deployHookUrl, triggerDeployHook} from '../scripts/trigger-vercel-hook.mjs';
import {verifyVercelCatalog} from '../scripts/verify-vercel-catalog.mjs';

test('Deploy Hook uses a fixed Vercel HTTPS destination and reports failure without URL or response body', async () => {
  const synthetic = 'https://api.vercel.com/v1/integrations/deploy/prj_Fixture/fake-token';
  for (const bad of ['', 'http://api.vercel.com/v1/integrations/deploy/prj_Fixture/fake-token',
    synthetic + '?redirect=example', synthetic.replace('api.vercel.com', 'example.test')]) {
    assert.throws(() => deployHookUrl(bad), /^Error: A valid Vercel Deploy Hook secret/);
  }
  await triggerDeployHook(synthetic, async (url, options) => {
    assert.equal(url.href, synthetic);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    return Response.json({job: {id:'fixture-id', state:'PENDING'}});
  });
  await assert.rejects(triggerDeployHook(synthetic, async () => new Response(synthetic, {status: 403})),
    {message:'Vercel Deploy Hook returned HTTP 403'});
  await assert.rejects(triggerDeployHook(synthetic, async () => {throw Error(synthetic);}),
    {message:'Vercel Deploy Hook request failed. Check Vercel before retrying.'});
  await assert.rejects(triggerDeployHook(synthetic, async () => Response.json({url:synthetic})),
    /acceptance was not confirmed/);
});

test('HTTPS catalog verification checks response type, native CORS, revalidation and published content bytes', async () => {
  const url = 'https://cashly-staging.example.test/content/videos.json';
  const catalog = {schemaVersion:1, channelId:'UC' + 'x'.repeat(22), channelName:'Fixture',
    handle:'@cashlybyVKS', lastSuccessfulSync:new Date().toISOString(), videos:[{
      id:'abcdefghijk', title:'Fixture', description:'Fixture', publishedAt:'2026-01-01',
      thumbnail:'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg', durationSeconds:65,
      language:'hi', contentType:'short', classificationSource:'creator-override', embeddable:true,
      watchUrl:'https://www.youtube.com/watch?v=abcdefghijk'
    }]};
  const bytes = Buffer.from(JSON.stringify(catalog));
  const headers = {'content-type':'application/json', 'access-control-allow-origin':'*',
    'cache-control':'public, max-age=0, must-revalidate'};
  const request = async (_, options) => {
    assert.equal(options.headers.Origin, 'https://localhost');
    assert.equal(options.redirect, 'error');
    return new Response(bytes, {headers});
  };
  assert.equal((await verifyVercelCatalog(url, bytes, request)).videos, 1);
  await assert.rejects(verifyVercelCatalog(url, Buffer.from('{}'), request), /differs/);
  await assert.rejects(verifyVercelCatalog(url, bytes, async () => new Response(bytes, {headers:{
    ...headers, 'access-control-allow-origin':'https://unrelated.example'
  }})), /WebView origin/);
  await assert.rejects(verifyVercelCatalog(url, bytes, async () => new Response(bytes, {headers:{
    ...headers, 'cache-control':'public, max-age=3600'
  }})), /revalidation/);
  await assert.rejects(verifyVercelCatalog(url, bytes, async () => new Response('missing', {status:404})),
    /HTTP 200/);
});
