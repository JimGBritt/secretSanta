'use strict';
const { app } = require('@azure/functions');
const { TableStore } = require('../lib/store');
const { makeHandlers } = require('../lib/handlers');

let handlers;
function get() {
  if (!handlers) {
    handlers = makeHandlers(new TableStore(process.env.STORAGE_CONNECTION), process.env.ADMIN_KEY);
  }
  return handlers;
}

async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

const wrap = (fn) => async (req, ctx) => {
  try {
    return await fn(req);
  } catch (err) {
    ctx.error(err);
    return { status: 500, jsonBody: { error: 'Something went wrong. Please try again.' } };
  }
};

app.http('state', {
  methods: ['GET'], authLevel: 'anonymous', route: 'state',
  handler: wrap(async () => ({ ...(await get().getState()), headers: { 'Cache-Control': 'no-store' } })),
});

app.http('reveal', {
  methods: ['POST'], authLevel: 'anonymous', route: 'reveal',
  handler: wrap(async (req) => ({ ...(await get().reveal(await readJson(req))), headers: { 'Cache-Control': 'no-store' } })),
});

app.http('manage', {
  methods: ['POST'], authLevel: 'anonymous', route: 'manage/{action}',
  handler: wrap(async (req) => get().admin(req.params.action, await readJson(req))),
});
