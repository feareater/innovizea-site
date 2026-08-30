/**
 * Rocket Scooter Race — TikTok chat helper.
 *
 * TikTok has no public live-chat API, so the browser cannot read it directly.
 * This little server exposes a WebSocket the game connects to; it subscribes to
 * a TikTok handle and relays every chat comment back as a small JSON message.
 *
 * You do NOT need this for YouTube, or to run the race — just open the game file.
 * As a convenience it also serves the game at http://localhost:8787, but opening
 * the file directly works exactly as well.
 *
 * Run it:   cd tiktok-helper && npm install && npm start
 *
 * Env vars:
 *   PORT          port to listen on            (default 8787)
 *   HOST          interface to bind            (default 127.0.0.1 — localhost only)
 *   SIGN_API_KEY  Euler Stream key, optional   (see README if TikTok rate-limits you)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const SIGN_API_KEY = process.env.SIGN_API_KEY || '';
// Convenience only — you can just double-click the game instead. The download package
// renames it, so look for either name.
const GAME_FILE = ['Race to the Moon.html', 'index.html']
  .map(f => path.join(__dirname, '..', f))
  .find(p => fs.existsSync(p)) || path.join(__dirname, '..', 'index.html');

const log = (...args) => console.log(new Date().toISOString().slice(11, 19), ...args);

/* ---------------------------------------------------------------- HTTP ---- */

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/' || url === '/index.html') {
    fs.readFile(GAME_FILE, (err, buf) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('index.html not found — expected it one level up from bridge/');
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(buf);
    });
    return;
  }

  if (url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: wss.clients.size }));
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

/* ----------------------------------------------------------- WebSocket ---- */

const wss = new WebSocketServer({ server });

/** Turn a library error into something a streamer can act on. */
function explain(message) {
  const m = String(message || '');
  if (/rate limit|429/i.test(m)) {
    return 'TikTok sign server rate limit. Wait a minute, or set a free Euler Stream key ' +
           'in SIGN_API_KEY (see bridge/README.md).';
  }
  if (/offline|not.*live|user_not_found|LIVE has ended/i.test(m)) {
    return 'That account is not live right now (or the @username is wrong).';
  }
  return 'TikTok connect failed: ' + m;
}

wss.on('connection', (ws) => {
  let connection = null;
  const send = (obj) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); };

  const teardown = () => {
    if (!connection) return;
    try { connection.disconnect(); } catch (e) { /* already gone */ }
    connection = null;
  };

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }
    if (msg.type !== 'subscribe') return;

    if (connection) { send({ type: 'status', message: 'Already subscribed.' }); return; }

    const platform = msg.platform || 'tiktok';
    if (platform !== 'tiktok') {
      send({ type: 'error', message: `This bridge only handles TikTok (got "${platform}"). YouTube runs straight from the browser.` });
      return;
    }

    const handle = String(msg.channel || '').trim();
    if (!handle) { send({ type: 'error', message: 'No TikTok @username given.' }); return; }

    send({ type: 'status', message: `Connecting to TikTok LIVE for ${handle}…` });
    log(`connecting ${handle}`);

    try {
      const opts = {};
      if (SIGN_API_KEY) opts.signApiKey = SIGN_API_KEY;
      connection = new TikTokLiveConnection(handle, opts);

      connection.on(WebcastEvent.CHAT, (data) => {
        const user = (data && data.user) || {};
        send({
          type: 'chat',
          platform: 'tiktok',
          // userId is the stable numeric id; uniqueId is the @handle. Either identifies
          // a viewer uniquely, so the game can hold them to one entry.
          userId: String(user.userId || user.uniqueId || ''),
          displayName: user.nickname || user.uniqueId || '',
          text: (data && data.comment) || '',
        });
      });

      connection.on(WebcastEvent.STREAM_END, () => {
        send({ type: 'status', message: 'TikTok stream ended.' });
        log(`stream ended ${handle}`);
      });
      connection.on(ControlEvent.DISCONNECTED, () => {
        send({ type: 'status', message: 'TikTok disconnected.' });
        log(`disconnected ${handle}`);
      });
      // Late errors must not take the whole process down.
      connection.on(ControlEvent.ERROR, (e) => log('tiktok error:', (e && e.message) || e));

      await connection.connect();
      send({ type: 'ready', message: `TikTok chat connected — ${handle}` });
      log(`connected ${handle}`);
    } catch (e) {
      const message = explain((e && e.message) || e);
      log('connect failed:', message);
      send({ type: 'error', message });
      teardown();
    }
  });

  ws.on('close', teardown);
  ws.on('error', teardown);
});

/* --------------------------------------------------------------- start ---- */

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  TikTok helper is running.');
  console.log('');
  console.log('  Go back to the game, pick "TikTok Live", and hit Connect.');
  console.log(`  (The game is also served at http://${HOST}:${PORT}/ if you prefer.)`);
  console.log('');
  console.log(SIGN_API_KEY ? '  Euler Stream key: set' : '  Euler Stream key: not set (fine until TikTok rate-limits you)');
  console.log('  Leave this window open while you stream. Ctrl+C to stop.');
  console.log('');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use. Start with a different one:  PORT=8788 npm start\n`);
    process.exit(1);
  }
  throw e;
});

process.on('SIGINT', () => { console.log('\n  Stopping.'); process.exit(0); });
