/* Zero-dependency static server with LAN access and a tiny shared sync endpoint.
   Run: node server.js   then open the printed "Network" URL on the other laptop.

   The app keeps its own localStorage copy for offline use. The /api/sync endpoint
   only carries the shared, presentation-critical data (deliveries, notifications,
   and per-vehicle trip times) so a driver's completion appears on an admin device
   in real time, even when the two browsers have separate localStorage stores. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, 'app');
const PORT = Number(process.env.PORT) || 3000;
const STATE_FILE = path.join(__dirname, '.shared-state.json');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

function lanIPs() {
  const out = [];
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach(name => {
    (nets[name] || []).forEach(n => {
      if (n.family === 'IPv4' && !n.internal) out.push(n.address);
    });
  });
  return out;
}

/* ---------------- shared sync state ---------------- */
let shared = { stamp: 0, deliveries: [], notifications: [], trips: {} };
try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  if (saved && typeof saved.stamp === 'number') shared = saved;
} catch (e) { /* first run, start empty */ }

let writeTimer = null;
function persistSoon() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try { fs.writeFileSync(STATE_FILE, JSON.stringify(shared)); } catch (e) { /* read-only folder */ }
  }, 250);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => {
      body += c;
      if (body.length > 4e6) { reject(new Error('payload too large')); req.destroy(); }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJSON(res, code, obj) {
  const data = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(data)
  });
  res.end(data);
}

/* ---------------- request handler ---------------- */
http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (urlPath === '/api/sync') {
    if (req.method === 'GET') return sendJSON(res, 200, shared);
    if (req.method === 'POST') {
      try {
        const incoming = JSON.parse(await readBody(req));
        const stamp = Number(incoming.stamp) || 0;
        if (stamp > shared.stamp && incoming.shared) {
          shared = {
            stamp,
            deliveries: Array.isArray(incoming.shared.deliveries) ? incoming.shared.deliveries : [],
            notifications: Array.isArray(incoming.shared.notifications) ? incoming.shared.notifications : [],
            trips: incoming.shared.trips && typeof incoming.shared.trips === 'object' ? incoming.shared.trips : {}
          };
          persistSoon();
        }
        return sendJSON(res, 200, shared);
      } catch (e) {
        return sendJSON(res, 400, { error: 'invalid sync payload' });
      }
    }
    res.writeHead(405, { 'Allow': 'GET, POST' }); return res.end('Method not allowed');
  }

  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n  FleetForward is running.\n');
  console.log('  On this laptop : http://localhost:' + PORT);
  lanIPs().forEach(ip => console.log('  On same WiFi   : http://' + ip + ':' + PORT));
  console.log('\n  Delivery sync  : /api/sync (shared across all connected devices)');
  console.log('  Keep this window open. Press Ctrl+C to stop.\n');
});
