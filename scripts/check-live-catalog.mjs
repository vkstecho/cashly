import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateManifest} from './validate-manifest.mjs';

const [catalogFile, expectedFile] = process.argv.slice(2);
assert.ok(catalogFile && expectedFile, 'Usage: node scripts/check-live-catalog.mjs CATALOG EXPECTATIONS');
const expectedChannel = process.env.YOUTUBE_CHANNEL_ID;
assert.match(expectedChannel || '', /^UC[\w-]{22}$/, 'Set the creator-verified YOUTUBE_CHANNEL_ID');
const catalog = validateManifest(JSON.parse(await readFile(catalogFile, 'utf8')));
const expected = JSON.parse(await readFile(expectedFile, 'utf8'));
assert.equal(catalog.channelId, expectedChannel);
assert.equal(catalog.handle.toLowerCase(), '@cashlybyvks');
const verifiedAt = Date.parse(catalog.lastSuccessfulSync);
assert.ok(verifiedAt >= Date.now() - 86400000 && verifiedAt <= Date.now() + 60000, 'Use a freshly synced catalog');

const matching = new Map();
for (const field of ['featuredVideo', 'short', 'hindi', 'english']) {
  const id = expected[field];
  assert.match(id || '', /^[\w-]{11}$/, 'Supply a verified public Cashly video ID for ' + field);
  const video = catalog.videos.find(item => item.id === id);
  assert.ok(video, field + ' missing from catalog');
  matching.set(field, video);
}
const featured = matching.get('featuredVideo');
assert.equal(featured.contentType, 'video');
assert.equal(featured.classificationSource, 'creator-override');
assert.equal(featured.embeddable, true);
assert.equal(matching.get('short').contentType, 'short');
for (const [field, code] of [['hindi', 'hi'], ['english', 'en']]) {
  const lang = matching.get(field).language.toLowerCase().replaceAll('_', '-');
  assert.ok(lang === code || lang.startsWith(code + '-') || ['hinglish', 'mixed', 'hi-en', 'en-hi'].includes(lang),
    field + ' language tag does not match');
}
for (const thumbnail of new Set([...matching.values()].map(item => item.thumbnail))) {
  const response = await fetch(thumbnail, {redirect: 'error', signal: AbortSignal.timeout(10000)});
  assert.ok(response.ok && /^image\/(jpeg|webp|png)\b/i.test(response.headers.get('content-type') || ''),
    'Thumbnail returned an unexpected HTTP status or type');
  assert.ok((await response.arrayBuffer()).byteLength > 0, 'Empty thumbnail');
}
console.log('Catalog identity, freshness, creator classifications, language metadata and sampled thumbnails passed.');
