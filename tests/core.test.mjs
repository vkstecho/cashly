import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { durationSeconds, videoRecord } from '../scripts/sync-youtube.mjs';

const sandbox = vm.createContext({});
vm.runInContext(readFileSync(new URL('../app/js/splits.js', import.meta.url), 'utf8'), sandbox);
test('apportions remainder paise deterministically', () => {
  assert.deepEqual([...sandbox.splitShares(100, 'equal', ['', '', ''])], [34, 33, 33]);
  assert.deepEqual([...sandbox.splitShares(10001, 'percent', ['25', '75'])], [2500, 7501]);
  assert.deepEqual([...sandbox.splitShares(10001, 'amount', ['25', '75.01'])], [2500, 7501]);
  assert.throws(() => sandbox.splitShares(10001, 'amount', ['25', '75']), /add up/);
  assert.throws(() => sandbox.splitShares(10001, 'percent', ['25', '50']), /100%/);
  assert.equal(sandbox.splitUnits('1.001'), null);
});
test('settlements credit the sender and debit the receiver', () => {
  const group = {people: [{}, {}, {}], expenses: [{payer: 0, total: 100, shares: [34, 33, 33]}],
    settlements: [{from: 1, to: 0, total: 33}]};
  const balances = [...sandbox.splitBalances(group)];
  assert.deepEqual(balances, [33, 0, -33]);
});
test('classifies Shorts from creator evidence and filters unavailable uploads', () => {
  const id = 'abcdefghijk', channelId = 'UCabcdefghijabcdefghijab';
  const video = {id, snippet: {channelId, title: 'Example', publishedAt: '2026-01-01', liveBroadcastContent: 'none'},
    status: {privacyStatus: 'public', uploadStatus: 'processed', embeddable: true}, contentDetails: {duration: 'PT35S'}};
  assert.equal(durationSeconds('PT1H2M3S'), 3723);
  assert.equal(durationSeconds('bad'), null);
  assert.equal(videoRecord(video, channelId, new Set(), {}).contentType, 'unknown');
  assert.equal(videoRecord(video, channelId, new Set([id]), {}).contentType, 'short');
  assert.equal(videoRecord(video, channelId, new Set([id]), {[id]: {contentType: 'video'}}).contentType, 'video');
  video.status.privacyStatus = 'unlisted';
  assert.equal(videoRecord(video, channelId, new Set(), {}), null);
});

test('safe to spend handles local month end, zero budget and overspending', () => {
  const source = readFileSync(new URL('../app/js/constants.js', import.meta.url), 'utf8');
  const context = vm.createContext({});
  const start = source.indexOf('function financePaise');
  vm.runInContext(source.slice(start, source.indexOf('function ', source.indexOf('return Math.max(0,Math.floor(remaining/days))/100;', start))),context);
  assert.equal(context.safeToSpend(100.01, 25.03, new Date(2024, 1, 29)), 74.98);
  assert.equal(context.safeToSpend(100.01, 0, new Date(2024, 1, 28)), 50);
  assert.equal(context.safeToSpend(10, 25.03, new Date(2024, 1, 29)), 0);
  assert.equal(context.safeToSpend(0, 0, new Date(2024, 1, 29)), 0);
});

test('imported spreadsheet arithmetic accepts numerical expressions without dynamic evaluation',()=>{
  const source=readFileSync(new URL('../app/js/ui-core.js',import.meta.url),'utf8');
  const from=source.indexOf('function evaluateImportedArithmetic');
  const cutoff=source.indexOf('function getCellNote',from);
  const context=vm.createContext({});
  vm.runInContext(source.slice(from,cutoff),context);
  assert.equal(context.parseNum('=(200 + 12.5) * 2'),425);
  assert.equal(context.parseNum('=3**2 + 1 / 2'),9.5);
  assert.equal(context.parseNum('=2 / 0'),0);
  assert.equal(context.parseNum('=alert(1)'),0);
});
