'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { cleanNames, makeDraw } = require('../src/lib/logic');
const { makeHandlers } = require('../src/lib/handlers');
const { MemoryStore } = require('../src/lib/store');

test('cleanNames trims, dedupes, drops blanks', () => {
  assert.deepStrictEqual(cleanNames(['  Ava ', 'ava', '', 'Mia  Rose', 'Zoe']), ['Ava', 'Mia Rose', 'Zoe']);
});

test('makeDraw: everyone gives once, receives once, never self (many runs, many sizes)', () => {
  for (let n = 2; n <= 40; n++) {
    const names = Array.from({ length: n }, (_, i) => 'N' + i);
    for (let run = 0; run < 50; run++) {
      const map = makeDraw(names);
      assert.deepStrictEqual(Object.keys(map).sort(), names.slice().sort());
      assert.deepStrictEqual(Object.values(map).sort(), names.slice().sort());
      for (const [g, r] of Object.entries(map)) assert.notStrictEqual(g, r);
    }
  }
});

test('makeDraw rejects fewer than 2', () => {
  assert.throws(() => makeDraw(['Solo']));
});

test('handlers: auth, draw, reveal, never leak assignments', async () => {
  const h = makeHandlers(new MemoryStore(), 'sekret');
  assert.strictEqual((await h.admin('check', { key: 'nope' })).status, 401);
  await h.admin('save', { key: 'sekret', names: ['A', 'B', 'C'], giftDate: '2026-12-20', giftNote: 'Bring a gift' });

  let pub = (await h.getState()).jsonBody;
  assert.deepStrictEqual(pub.names, ['A', 'B', 'C']);
  assert.strictEqual(pub.drawn, false);
  assert.deepStrictEqual((await h.reveal({ name: 'A' })).jsonBody, { drawn: false });
  assert.strictEqual((await h.reveal({ name: 'Nobody' })).status, 404);

  assert.strictEqual((await h.admin('draw', { key: 'sekret' })).status, 200);
  pub = (await h.getState()).jsonBody;
  assert.strictEqual(pub.drawn, true);
  assert.ok(!('assignments' in pub));
  assert.strictEqual((await h.admin('draw', { key: 'sekret' })).status, 409);

  const r1 = (await h.reveal({ name: 'A' })).jsonBody;
  const r2 = (await h.reveal({ name: 'A' })).jsonBody;
  assert.strictEqual(r1.giftee, r2.giftee); // stable on reload
  assert.notStrictEqual(r1.giftee, 'A');

  assert.strictEqual((await h.admin('save', { key: 'sekret', names: ['A', 'B'] })).status, 409);
  assert.strictEqual((await h.admin('reset', { key: 'sekret' })).status, 200);
  assert.strictEqual((await h.getState()).jsonBody.drawn, false);
});

test('handlers: refuses all admin access if no key configured', async () => {
  const h = makeHandlers(new MemoryStore(), undefined);
  assert.strictEqual((await h.admin('check', { key: '' })).status, 401);
});
