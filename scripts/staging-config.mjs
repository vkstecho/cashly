import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const initializer = /^try\{firebase\.initializeApp\(.*$/m;
const productionMedia = 'https://firebasestorage.googleapis.com/v0/b/';

export async function readStagingConfig(root, local, native) {
  if (local) {
    const {emulators} = JSON.parse(await readFile(path.join(root, 'firebase.emulator.json'), 'utf8'));
    for (const name of ['auth', 'firestore', 'storage']) {
      if (emulators[name]?.host !== '127.0.0.1' || !Number.isInteger(emulators[name].port)) {
        throw Error('Local staging requires loopback Firebase emulators');
      }
    }
    return {firebase: {apiKey: 'demo-cashly-v81-key', projectId: 'demo-cashly-v81',
      authDomain: 'demo-cashly-v81.firebaseapp.com', storageBucket: 'demo-cashly-v81.appspot.com'}, emulators};
  }

  const file = process.env.CASHLY_STAGING_CONFIG;
  const sourceConfig = process.env.CASHLY_STAGING_FIREBASE_JSON || (file && await readFile(file, 'utf8'));
  if (!sourceConfig) throw Error('A separate Firebase web configuration is required');
  let config;
  try { config = JSON.parse(sourceConfig); } catch { throw Error('The staging Firebase web configuration must be valid JSON'); }
  if (!config || typeof config !== 'object') throw Error('Use the staging Firebase web configuration object');
  const source = await readFile(path.join(root, 'app/js/config.js'), 'utf8');
  const liveProject = source.match(/projectId:"([^"]+)"/)?.[1];
  const liveApiKey = source.match(/apiKey:"([^"]+)"/)?.[1];
  const liveAppId = source.match(/appId:"([^"]+)"/)?.[1];
  const {projectId, authDomain, storageBucket, apiKey, appId, messagingSenderId} = config;
  if (!liveProject || !liveApiKey || !liveAppId || projectId === liveProject || apiKey === liveApiKey || appId === liveAppId
      || !/^[a-z][a-z0-9-]+[a-z0-9]$/.test(projectId || '')
      || authDomain !== projectId + '.firebaseapp.com'
      || ![projectId + '.firebasestorage.app', projectId + '.appspot.com'].includes(storageBucket)
      || typeof apiKey !== 'string' || !apiKey || typeof appId !== 'string' || !appId) {
    throw Error('Use the Firebase web config and default bucket of a separate staging project');
  }
  const firebase = {projectId, authDomain, storageBucket, apiKey, appId, messagingSenderId};
  if (!native) return {firebase};

  const content = new URL(process.env.CASHLY_STAGING_CONTENT_BASE || 'https://invalid.invalid/');
  if (content.protocol !== 'https:' || content.username || content.password || content.search
      || content.hash || ['invalid.invalid', 'cashly.vkstech.com'].includes(content.hostname)
      || !content.pathname.endsWith('/')) {
    throw Error('Native staging requires a separate HTTPS content base with a trailing slash');
  }
  return {firebase, content};
}

export async function configureStaging(output, config, local, native) {
  const configPath = path.join(output, 'app/js/config.js');
  const source = await readFile(configPath, 'utf8');
  if (!initializer.test(source)) throw Error('Could not replace the staging Firebase initializer');
  let setup = '';
  if (local) {
    const {auth, firestore, storage} = config.emulators;
    setup = 'if (!["127.0.0.1","localhost"].includes(location.hostname)) throw Error("Local staging requires loopback");'
      + 'auth.useEmulator("http://127.0.0.1:' + auth.port + '");'
      + 'db.useEmulator("127.0.0.1",' + firestore.port + ');'
      + 'storage.useEmulator("127.0.0.1",' + storage.port + ');';
    const mediaPath = path.join(output, 'app/js/ui-core.js');
    const media = await readFile(mediaPath, 'utf8');
    if (!media.includes(productionMedia)) throw Error('Could not replace the staging Storage media URL');
    await writeFile(mediaPath, media.replace(productionMedia, 'http://127.0.0.1:' + storage.port + '/v0/b/'));
  }
  const init = 'try{firebase.initializeApp(' + JSON.stringify(config.firebase) + ');'
    + 'auth=firebase.auth();db=firebase.firestore();storage=firebase.storage();'
    + setup + 'fbOk=true}catch(e){auth=db=storage=null;console.error("Cashly staging Firebase initialization failed");}';
  const contentBase = native ? 'window.CASHLY_CONTENT_BASE=' + JSON.stringify(config.content.href) + ';\n' : '';
  await writeFile(configPath, source.replace(initializer, () => contentBase + init));
  if (native) {
    const index = path.join(output, 'app/index.html');
    const html = await readFile(index, 'utf8');
    if (!html.includes("frame-src 'self' https://cashly.vkstech.com ")) throw Error('Could not replace the staging content frame origin');
    await writeFile(index, html.replace("frame-src 'self' https://cashly.vkstech.com ", "frame-src 'self' " + config.content.origin + ' '));
  }
}
