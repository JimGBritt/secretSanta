// Local preview: serves /public and the API handlers with an in-memory store.
//   ADMIN_KEY=test node dev/server.js   ->  http://localhost:4280
const http = require('http');
const fs = require('fs');
const path = require('path');
const { makeHandlers } = require('../api/src/lib/handlers');
const { MemoryStore } = require('../api/src/lib/store');

const h = makeHandlers(new MemoryStore(), process.env.ADMIN_KEY || 'test');
const pub = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const send = (r) => { res.writeHead(r.status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(r.jsonBody)); };
  try {
    if (url.pathname.startsWith('/api/')) {
      let body = ''; for await (const c of req) body += c;
      const json = body ? JSON.parse(body) : {};
      if (url.pathname === '/api/state') return send(await h.getState());
      if (url.pathname === '/api/reveal') return send(await h.reveal(json));
      if (url.pathname.startsWith('/api/manage/')) return send(await h.admin(url.pathname.split('/').pop(), json));
    }
    let f = url.pathname === '/' ? '/index.html' : url.pathname === '/admin' ? '/admin.html' : url.pathname;
    const file = path.join(pub, path.normalize(f));
    if (!file.startsWith(pub) || !fs.existsSync(file)) { res.writeHead(404); return res.end('nope'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(4280, () => console.log('http://localhost:4280'));
