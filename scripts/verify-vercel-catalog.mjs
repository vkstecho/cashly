import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {validateManifest} from './validate-manifest.mjs';

export async function verifyVercelCatalog(url, expectedBytes, request = fetch) {
  const target = new URL(url);
  assert.ok(target.protocol === 'https:' && !target.username && !target.password && !target.search && !target.hash
    && target.pathname === '/content/videos.json', 'Use the HTTPS /content/videos.json endpoint');
  const nativeOrigin = 'https://localhost';
  const response = await request(target, {
    headers: {Origin: nativeOrigin, 'Cache-Control': 'no-cache'},
    redirect: 'error', signal: AbortSignal.timeout(15000)
  });
  assert.equal(response.status, 200, 'Catalog endpoint did not return HTTP 200');
  assert.match(response.headers.get('content-type') || '', /^application\/json\b/i);
  const cors = response.headers.get('access-control-allow-origin');
  assert.ok(cors === '*' || cors === nativeOrigin, 'Catalog does not allow the HTTPS native WebView origin');
  const cacheControl = response.headers.get('cache-control') || '';
  assert.ok(/\bno-(cache|store)\b/i.test(cacheControl)
    || (/\bmax-age=0\b/i.test(cacheControl) && /\bmust-revalidate\b/i.test(cacheControl)),
  'Catalog cache policy does not require revalidation');

  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = data => createHash('sha256').update(data).digest('hex');
  assert.equal(digest(bytes), digest(expectedBytes), 'Catalog differs from the expected published revision');
  const catalog = validateManifest(JSON.parse(bytes));
  const age = Date.now() - Date.parse(catalog.lastSuccessfulSync);
  assert.ok(catalog.videos.length && age >= -60000 && age < 30 * 86400000, 'A populated, recently verified catalog is required');
  return {sha256:digest(bytes), lastSuccessfulSync:catalog.lastSuccessfulSync, videos:catalog.videos.length};
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const [url, file] = process.argv.slice(2);
    assert.ok(url && file, 'Usage: node scripts/verify-vercel-catalog.mjs HTTPS_CATALOG_URL EXPECTED_CATALOG');
    console.log(await verifyVercelCatalog(url, await readFile(file)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
