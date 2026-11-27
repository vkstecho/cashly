import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment, assertSucceeds, assertFails} from '@firebase/rules-unit-testing';
import {collection, doc, getDoc, getDocs, getDocFromServer, runTransaction, setDoc, updateDoc, deleteDoc, writeBatch} from 'firebase/firestore';
import '../app/js/sync.js';

const emulator = process.env.FIRESTORE_EMULATOR_HOST;
if (!/^127\.0\.0\.1:\d+$/.test(emulator || '')) throw Error('Run with the isolated loopback emulator');
const env = await initializeTestEnvironment({
  projectId: 'demo-cashly-v81',
  firestore: {rules: readFileSync(process.env.CASHLY_FIRESTORE_RULES || 'firestore.v81.rules', 'utf8')}
});
const owner = env.authenticatedContext('owner').firestore();
const other = env.authenticatedContext('other').firestore();
const guest = env.unauthenticatedContext().firestore();
const ownerDoc = doc(owner, 'users/owner');
const legacy = {data: {transactions: []}, updated: 123};
const v81 = {...legacy, name: 'Owner', cashlySchema: 81, cashlyRevision: 1};

try {
  await test('exact V8.1 creation is owner-only and outside paths and queries are denied', async () => {
    await env.clearFirestore();
    await assertFails(setDoc(ownerDoc, legacy));
    await assertFails(setDoc(ownerDoc, {...v81, unrecognized: true}));
    await assertFails(setDoc(ownerDoc, {...v81, cashlyRevision: 2}));
    await assertFails(setDoc(ownerDoc, {...v81, updated: '123'}));
    await assertFails(setDoc(ownerDoc, {...v81, updated: -1}));
    const {updated, ...incomplete} = v81;
    await assertFails(setDoc(ownerDoc, incomplete));
    await assertFails(setDoc(doc(other, 'users/owner'), v81));
    await assertFails(setDoc(doc(guest, 'users/owner'), v81));
    await assertSucceeds(setDoc(ownerDoc, v81));
    assert.deepEqual((await assertSucceeds(getDoc(ownerDoc))).data(), v81);
    await assertFails(getDoc(doc(other, 'users/owner')));
    await assertFails(getDoc(doc(guest, 'users/owner')));
    await assertFails(getDocs(collection(owner, 'users')));
    for (const path of ['settings/owner', 'users/owner/private/other']) {
      await assertFails(getDoc(doc(owner, path)));
      await assertFails(setDoc(doc(owner, path), v81));
      await assertFails(deleteDoc(doc(owner, path)));
    }
  });

  await test('unversioned data migrates once, preserving legitimate historical fields', async () => {
    await env.clearFirestore();
    const seed = {data: {transactions: [], monthlyBudget: 1234}, updated: 123};
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'users/owner'), seed);
      await setDoc(doc(context.firestore(), 'users/other'), {...seed, name: 'Old profile', historicalTag: true});
    });
    assert.deepEqual((await assertSucceeds(getDoc(ownerDoc))).data(), seed);
    await assertFails(setDoc(ownerDoc, legacy, {merge: true}));
    await assertFails(setDoc(ownerDoc, {...v81, cashlyRevision: 2}, {merge: true}));
    await assertSucceeds(setDoc(ownerDoc, {...v81, data: seed.data}, {merge: true}));
    assert.deepEqual((await getDoc(ownerDoc)).data().data, seed.data);

    const historical = doc(other, 'users/other');
    await assertFails(setDoc(historical, v81));
    await assertFails(setDoc(historical, {...v81, historicalTag: false}, {merge: true}));
    await assertSucceeds(setDoc(historical, {...v81, data: seed.data}, {merge: true}));
    assert.equal((await getDoc(historical)).data().historicalTag, true);
  });

  await test('revisioned writes reject legacy, malformed, stale and foreign changes', async () => {
    await env.clearFirestore();
    await setDoc(ownerDoc, v81);
    await assertFails(setDoc(ownerDoc, legacy));
    await assertFails(setDoc(ownerDoc, legacy, {merge: true}));
    await assertFails(setDoc(ownerDoc, {...legacy, name:'Legacy V8'}, {merge: true}));
    await assertFails(writeBatch(owner).set(ownerDoc, legacy, {merge: true}).commit());
    await assertFails(updateDoc(ownerDoc, {data: {transactions: []}}));
    await assertFails(updateDoc(ownerDoc, {cashlyRevision: 1}));
    await assertFails(updateDoc(ownerDoc, {cashlyRevision: 3}));
    await assertFails(updateDoc(ownerDoc, {cashlyRevision: 2.5}));
    await assertFails(updateDoc(ownerDoc, {cashlyRevision: 2, cashlySchema: '81'}));
    await assertFails(updateDoc(ownerDoc, {cashlyRevision: 2, data: {transactions: {}}}));
    await assertFails(updateDoc(ownerDoc, {cashlyRevision: 2, unrecognized: true}));
    const next = {...v81, cashlyRevision: 2, updated: 456};
    await assertFails(setDoc(doc(other, 'users/owner'), next, {merge: true}));
    await assertFails(setDoc(doc(guest, 'users/owner'), next, {merge: true}));
    await assertSucceeds(setDoc(ownerDoc, next, {merge: true}));
    await assertFails(setDoc(ownerDoc, next, {merge: true}));
    assert.deepEqual((await getDoc(ownerDoc)).data(), next);
  });

  await test('only the owner can delete an existing user document and legacy recreate is denied', async () => {
    await env.clearFirestore();
    await setDoc(ownerDoc, v81);
    await assertFails(deleteDoc(doc(other, 'users/owner')));
    await assertFails(deleteDoc(doc(guest, 'users/owner')));
    await assertSucceeds(deleteDoc(ownerDoc));
    assert.equal((await getDoc(ownerDoc)).exists(), false);
    await assertFails(setDoc(ownerDoc, legacy));
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'users/owner'), legacy));
    await assertSucceeds(deleteDoc(ownerDoc));
  });

  await test('two SDK transactions reconcile concurrent independent writes', async () => {
    await env.clearFirestore();
    await setDoc(ownerDoc, v81);
    const second = env.authenticatedContext('owner').firestore();
    const {decide, runRevisionTransaction} = globalThis.cashlySyncModel;
    await Promise.all([[owner, 'a'], [second, 'b']].map(([client, id]) => {
      const ref = doc(client, 'users/owner');
      return runRevisionTransaction(callback => runTransaction(client, callback),
        async () => (await getDocFromServer(ref)).data().cashlyRevision,
        async (tx, observe) => {
          const remote = (await tx.get(ref)).data();
          observe(remote.cashlyRevision);
          const outcome = decide({base: {data:v81.data, profile:'Owner', revision:1}, data:{transactions:[{id}]}, profile:'Owner'},
            {data:remote.data, profile:remote.name, revision:remote.cashlyRevision});
          assert.equal(outcome.conflicts?.length || 0, 0);
          tx.set(ref, {data:outcome.data, name:outcome.profile, cashlyRevision:remote.cashlyRevision + 1,
            cashlySchema:81, updated:Date.now()}, {merge:true});
        });
    }));
    const saved = (await getDoc(ownerDoc)).data();
    assert.equal(saved.cashlyRevision, 3);
    assert.deepEqual(saved.data.transactions.map(item => item.id).sort(), ['a','b']);
  });
} finally {
  await env.cleanup();
}
