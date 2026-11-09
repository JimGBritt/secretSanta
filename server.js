'use strict';
// Serves /public and the JSON API. Uses Azure Table Storage when STORAGE_CONNECTION is set,
// otherwise an in-memory store (handy for local preview):  ADMIN_KEY=test node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { makeHandlers } = require('./src/lib/handlers');
const { TableStore, MemoryStore } = require('./src/lib/store');

const store = process.env.STORAGE_CONNECTION ? new TableStore(process.env.STORAGE_CONNECTION) : new MemoryStore();
const h = makeHandlers(store, process.env.ADMIN_KEY);
const pub = path.join(__dirname, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'",
};

async function readBody(req) {
  let body = '';
  for await (const c of req) { body += c; if (body.length > 20000) throw new Error('too big'); }
  try { return body ? JSON.parse(body) : {}; } catch { return {}; }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const json = (r) => {
    res.writeHead(r.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...SECURITY });
    res.end(JSON.stringify(r.jsonBody));
  };
  try {
    const p = url.pathname;
    if (p.startsWith('/api/')) {
      if (req.method === 'GET' && p === '/api/state') return json(await h.getState());
      if (req.method === 'POST' && p === '/api/reveal') return json(await h.reveal(await readBody(req)));
      if (req.method === 'POST' && p.startsWith('/api/manage/')) return json(await h.admin(p.split('/').pop(), await readBody(req)));
      return json({ status: 404, jsonBody: { error: 'Not found' } });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    const f = p === '/' ? '/index.html' : p === '/admin' ? '/admin.html' : p;
    const file = path.join(pub, path.normalize(f));
    if (!file.startsWith(pub + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, SECURITY); return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...SECURITY });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    json({ status: 500, jsonBody: { error: 'Something went wrong. Please try again.' } });
  }
});

server.listen(process.env.PORT || 4280, () => console.log('Secret Santa listening'));
