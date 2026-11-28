import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {validateManifest} from './validate-manifest.mjs';
import {configureStaging, readStagingConfig} from './staging-config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] || 'native';
if (!['vercel', 'native', 'staging', 'native-staging'].includes(mode)) throw Error('Unknown staging target');
const native = mode.startsWith('native');
const vercel = mode === 'vercel';
const approvedLive = process.env.VERCEL_ENV === 'production' && process.env.CASHLY_VERCEL_LIVE_APPROVED === 'true';
const staging = mode.endsWith('staging') || (vercel && !approvedLive);
const local = mode === 'staging' && !process.env.CASHLY_STAGING_CONFIG && !process.env.CASHLY_STAGING_FIREBASE_JSON;
const stagingConfig = staging && await readStagingConfig(root, local, native);
const output = path.join(root, native ? 'app/dist-native' : vercel ? 'dist-vercel' : 'dist-staging');
const catalog=process.env.CASHLY_CATALOG_PATH||path.join(root,'content/videos.json');
validateManifest(JSON.parse(await readFile(catalog,'utf8')));
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'app'), { recursive: true });
const publicRoots = ['assets', 'blog', 'css', 'js', 'calculators.html', 'blog.html', 'videos.html', 'favicon.ico'];
for (const name of publicRoots) await cp(path.join(root, name), path.join(output, name), { recursive: true });
await mkdir(path.join(output, 'content'));
await cp(catalog, path.join(output, 'content/videos.json'));
for (const entry of await readdir(path.join(root, 'app'))) {
  if (staging && entry === '.well-known') continue;
  if (['assets', 'css', 'js', '.well-known'].includes(entry) || /\.(html|ico|png)$/.test(entry)
      || ['manifest.json', 'sw.js'].includes(entry)) {
    await cp(path.join(root, 'app', entry), path.join(output, 'app', entry), { recursive: true });
  }
}
if (native) {
  await writeFile(path.join(output, 'index.html'),
    '<!doctype html><html lang="en"><title>Cashly</title><meta http-equiv="refresh" content="0;url=app/"><a href="app/">Open Cashly</a></html>');
} else {
  for (const name of ['index.html','privacy.html','support.html','terms.html','delete-account.html','manifest.json','sw.js']) {
    await cp(path.join(root, name), path.join(output, name));
  }
  for (const name of await readdir(root)) {
    if (/\.png$/.test(name) || name === 'robots.txt' || /^sitemap(?:-[\w-]+)?\.xml$/.test(name)) {
      await cp(path.join(root, name), path.join(output, name));
    }
  }
  if (!staging) {
    await cp(path.join(root, 'admin.html'), path.join(output, 'admin.html'));
    await cp(path.join(root, 'assetlinks.json'), path.join(output, 'assetlinks.json'));
    await mkdir(path.join(output, '.well-known'));
    await cp(path.join(root, '.well-known/assetlinks.json'), path.join(output, '.well-known/assetlinks.json'));
  }
}
if (staging) await configureStaging(output, stagingConfig, local, native);
