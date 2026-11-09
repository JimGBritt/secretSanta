'use strict';
const crypto = require('crypto');
const { cleanNames, makeDraw } = require('./logic');

const ok = (body) => ({ status: 200, jsonBody: body });
const fail = (status, message) => ({ status, jsonBody: { error: message } });

/** What anyone with the link may see. Never includes assignments. */
function publicView(s) {
  return { names: s.names, drawn: !!s.assignments, giftDate: s.giftDate, giftNote: s.giftNote };
}

function keyMatches(given, expected) {
  if (!expected || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function makeHandlers(store, adminKey) {
  return {
    async getState() {
      return ok(publicView(await store.load()));
    },

    async reveal(body) {
      const s = await store.load();
      const name = String(body && body.name || '');
      if (!s.names.includes(name)) return fail(404, 'We could not find that dancer.');
      if (!s.assignments) return ok({ drawn: false });
      return ok({ drawn: true, giftee: s.assignments[name], giftDate: s.giftDate, giftNote: s.giftNote });
    },

    async admin(action, body) {
      if (!keyMatches(body && body.key, adminKey)) {
        await new Promise((r) => setTimeout(r, 400)); // slow down guessing
        return fail(401, 'That password is not right.');
      }
      const s = await store.load();

      switch (action) {
        case 'check':
          return ok(publicView(s));

        case 'save': {
          const names = cleanNames(body.names);
          const changed = JSON.stringify(names) !== JSON.stringify(s.names);
          if (s.assignments && changed) {
            return fail(409, 'The draw has already happened. Reset the draw before changing names.');
          }
          s.names = names;
          s.giftDate = String(body.giftDate || '').slice(0, 10);
          s.giftNote = String(body.giftNote || '').replace(/\r\n?/g, '\n').trim().slice(0, 2000);
          await store.save(s);
          return ok(publicView(s));
        }

        case 'draw':
          if (s.assignments) return fail(409, 'The draw has already happened.');
          if (s.names.length < 2) return fail(400, 'Add at least 2 names first.');
          s.assignments = makeDraw(s.names);
          await store.save(s);
          return ok(publicView(s));

        case 'reset':
          s.assignments = null;
          await store.save(s);
          return ok(publicView(s));

        default:
          return fail(404, 'Unknown action.');
      }
    },
  };
}

module.exports = { makeHandlers, publicView, keyMatches };
