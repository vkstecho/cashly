const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

const base = new URL(process.env.CASHLY_TEST_URL || 'http://127.0.0.1:8790');
if (base.protocol !== 'http:' || base.hostname !== '127.0.0.1') throw Error('Use loopback staging');
const hosts = ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']
  .map(key => process.env[key]);
if (hosts.some(host => !/^127\.0\.0\.1:\d+$/.test(host || ''))) {
  throw Error('Run inside firebase emulators:exec with the demo project');
}

async function run() {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({serviceWorkers: 'block'});
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      const sdk = url.origin === 'https://www.gstatic.com'
        && /^\/firebasejs\/10\.12\.2\/firebase-(app|auth|firestore|storage)-compat\.js$/.test(url.pathname);
      if (sdk && process.env.CASHLY_FIREBASE_SDK_DIR) {
        return route.fulfill({path: path.join(process.env.CASHLY_FIREBASE_SDK_DIR, path.basename(url.pathname)),
          contentType:'application/javascript'});
      }
      return url.origin === base.origin || (url.protocol === 'http:' && hosts.includes(url.host)) || sdk
        ? route.continue() : route.abort();
    });
    await page.goto(new URL('/app/', base).href);
    assert.equal(await page.evaluate(() => firebase.app().options.projectId), 'demo-cashly-v81');
    const syntheticUser = await page.evaluate(async () => {
      const email = 'acceptance-' + crypto.randomUUID() + '@example.test';
      const result = await auth.createUserWithEmailAndPassword(email, 'synthetic-staging-only');
      return result.user.uid;
    });
    await page.waitForFunction(user => syncOwner(user) && !document.getElementById('AS').classList.contains('hidden'), syntheticUser);
    await page.waitForFunction(() => syncStatus === 'synced' && cashlyWrites.size === 0);
    const result = await page.evaluate(async user => {
      const ref = db.collection('users').doc(user);
      const history = {id:'staging-only', type:'expense', amount:123.45, date:tdy(), category:'food'};
      D.transactions.push(history);
      sv();
      await cloudLoad();
      const created = await ref.get({source:'server'});
      D.transactions.find(transaction => transaction.id === history.id).amount = 234.56;
      sv();
      await cloudLoad();
      const saved = await ref.get({source:'server'});
      const workbook = storage.ref('users/' + user + '/itr/synthetic.xls');
      const bytes = new Uint8Array([1, 5, 9]);
      await workbook.put(new Blob([bytes], {type:'application/vnd.ms-excel'}));
      D.itrFile = {path:workbook.fullPath};
      let read;
      parseITRFile = blob => {read = blob;};
      await fetchITRFromCloud();
      await workbook.delete();
      return {firstRevision:created.data().cashlyRevision, writtenRevision:saved.data().cashlyRevision,
        amount:saved.data().data.transactions[0].amount,
        bytes:read && Array.from(new Uint8Array(await read.arrayBuffer()))};
    }, syntheticUser);
    assert.equal(result.firstRevision, 1);
    assert.equal(result.writtenRevision, 2);
    assert.equal(result.amount, 234.56);
    assert.deepEqual(result.bytes, [1, 5, 9]);
    console.log('Chromium staging passed Auth sign-in, Firestore revision read/write and authenticated ITR media fetch.');
  } finally {
    await browser.close();
  }
}

run().catch(error => {console.error(error); process.exitCode = 1;});
