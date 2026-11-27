import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {deleteObject, getBytes, getDownloadURL, listAll, ref, updateMetadata, uploadBytes} from 'firebase/storage';

const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
if (!/^127\.0\.0\.1:\d+$/.test(host || '')) throw Error('Run with the isolated loopback emulator');
const projectId = 'demo-cashly-v81';
const bucket = projectId + '.appspot.com';
const env = await initializeTestEnvironment({
  projectId, storage: {host: '127.0.0.1', port: Number(host.split(':')[1]),
    rules: readFileSync(process.env.CASHLY_STORAGE_RULES || 'storage.v81.rules', 'utf8')}
});
const owner = env.authenticatedContext('owner').storage('gs://' + bucket);
const other = env.authenticatedContext('other').storage('gs://' + bucket);
const guest = env.unauthenticatedContext().storage('gs://' + bucket);
const file = 'users/owner/itr/synthetic.XLSX';
const bytes = new Uint8Array([1, 2, 3, 4]);
const excel = {contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};

try {
  await test('candidate Storage gates owner downloads, creation, listing and deletion', async () => {
    await env.clearStorage();
    const own = ref(owner, file);
    await assertSucceeds(uploadBytes(own, bytes, excel));
    assert.deepEqual(new Uint8Array(await getBytes(own)), bytes);
    await assertFails(getBytes(ref(other, file)));
    await assertFails(getBytes(ref(guest, file)));
    await assertFails(uploadBytes(ref(other, 'users/owner/itr/other.xls'), bytes, excel));
    await assertFails(uploadBytes(ref(guest, 'users/owner/itr/guest.xls'), bytes, excel));
    await assertFails(uploadBytes(ref(owner, 'users/owner/itr/nested/file.xlsx'), bytes, excel));
    await assertFails(uploadBytes(ref(owner, 'users/owner/itr/file.pdf'), bytes, excel));
    await assertFails(uploadBytes(ref(owner, 'users/owner/itr/file.xls'), bytes, {contentType: 'text/plain'}));
    await assertFails(uploadBytes(ref(owner, 'users/owner/itr/large.xls'), new Uint8Array(5 * 1024 * 1024 + 1), excel));
    await assertSucceeds(uploadBytes(ref(owner, 'users/owner/itr/old.xls'), bytes, {contentType: 'application/octet-stream'}));
    await assertFails(uploadBytes(own, bytes, excel));
    await assertFails(updateMetadata(own, {contentType: 'application/octet-stream'}));
    await assertFails(listAll(ref(owner, 'users/owner/itr')));
    await assertFails(deleteObject(ref(other, file)));
    await assertFails(deleteObject(ref(guest, file)));
    await assertSucceeds(deleteObject(own));
    await assert.rejects(getBytes(own), {code: 'storage/object-not-found'});
  });

  await test('a synthetic bearer URL bypasses Rules until the emulator administrator revokes it', async () => {
    await env.clearStorage();
    const own = ref(owner, file);
    await assertSucceeds(uploadBytes(own, bytes, excel));
    const url = new URL(await getDownloadURL(own));
    assert.equal(url.host, host);
    assert.ok(url.searchParams.has('token'));
    const unsigned = new URL(url);
    unsigned.searchParams.delete('token');
    assert.ok([401, 403].includes((await fetch(unsigned)).status));
    const result = await fetch(url);
    assert.equal(result.status, 200);
    assert.deepEqual(new Uint8Array(await result.arrayBuffer()), bytes);
    const revocation = new URL(unsigned);
    revocation.search = new URLSearchParams({delete_token: url.searchParams.get('token')});
    const revoked = await fetch(revocation, {method: 'POST', headers: {Authorization: 'Bearer owner'}});
    assert.equal(revoked.status, 200);
    assert.ok([401, 403, 404].includes((await fetch(url)).status));
    assert.deepEqual(new Uint8Array(await getBytes(own)), bytes);
  });
} finally {
  await env.cleanup();
}
