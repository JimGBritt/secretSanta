'use strict';
const crypto = require('crypto');

const MAX_NAMES = 100;
const MAX_NAME_LEN = 30;

/** Trim, collapse spaces, drop blanks and case-insensitive duplicates. */
function cleanNames(input) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(input) ? input : []) {
    const name = String(raw).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LEN);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.slice(0, MAX_NAMES);
}

function randomInt(n) {
  return crypto.randomInt(n);
}

/**
 * Shuffle everyone into one big circle; each person gives to the next.
 * Guarantees nobody draws themselves and everybody gives and receives exactly once.
 */
function makeDraw(names, rand = randomInt) {
  if (names.length < 2) throw new Error('Need at least 2 names to draw.');
  const a = names.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  const map = {};
  a.forEach((n, i) => { map[n] = a[(i + 1) % a.length]; });
  return map;
}

module.exports = { cleanNames, makeDraw, MAX_NAMES, MAX_NAME_LEN };
