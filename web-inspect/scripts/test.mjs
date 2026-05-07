#!/usr/bin/env node
/**
 * Manual test harness for web-inspect — zero deps, no coding agent needed.
 *
 *   1. Spawns server.mjs --background and reads .runtime/state.json.
 *   2. Static-serves test.html on a chosen port, injecting the overlay
 *      <script> tag at request time (no on-disk modification).
 *   3. Polls the helper and pretty-prints batch / exit / timeout events.
 *   4. SIGINT or an "exit" event tears the helper down and exits.
 *
 *   node scripts/test.mjs                # default static port 7780
 *   node scripts/test.mjs --port 9090
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.dirname(__dirname);
const PID_FILE = path.join(SKILL_DIR, '.runtime', 'state.json');
const TEST_HTML = path.join(__dirname, 'test.html');

function parseArgs(argv) {
  const args = { port: 7780 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') args.port = Number(argv[++i]);
    else if (argv[i] === '--help' || argv[i] === '-h') args.help = true;
  }
  return args;
}

function findOpenPort(start) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', () => resolve(findOpenPort(start + 1)));
    srv.listen(start, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function bootHelper() {
  // server.mjs --background spawns and exits once the child writes the PID
  // file, then prints the connection JSON on stdout.
  const out = spawnSync(process.execPath, [path.join(__dirname, 'server.mjs'), '--background'], {
    encoding: 'utf-8', cwd: process.cwd(), timeout: 15_000,
  });
  const line = String(out.stdout || out.stderr || '').trim().split('\n').filter(Boolean).pop() || '';
  let parsed;
  try { parsed = JSON.parse(line); } catch { parsed = null; }
  if (!parsed || !parsed.ok) {
    throw new Error(`helper failed to start: ${out.stdout || out.stderr || '(no output)'}`);
  }
  return parsed; // { ok, pid, port, token, sessionId, startedAt }
}

function injectScriptTag(html, helperPort, helperToken) {
  const tag = `<script src="http://127.0.0.1:${helperPort}/overlay.js?token=${encodeURIComponent(helperToken)}" data-web-inspect defer></script>`;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `  ${tag}\n</body>`);
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
  return `${html}\n${tag}\n`;
}

function startStaticServer(port, helper) {
  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html' || req.url === '/test.html') {
      let html;
      try { html = fs.readFileSync(TEST_HTML, 'utf-8'); }
      catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`failed to read test.html: ${err.message}`);
        return;
      }
      const body = injectScriptTag(html, helper.port, helper.token);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(body);
      return;
    }
    // /missing-endpoint and friends: 404 (deliberately, for the network-error capture demo).
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

function fmtAnnotation(a, i) {
  const tag = (a.element && a.element.tagName) || '?';
  const cls = a.element && a.element.classes && a.element.classes.length ? '.' + a.element.classes.join('.') : '';
  const sel = (a.element && a.element.selector) || '';
  const comment = (a.comment || '(no comment)').replace(/\s+/g, ' ').slice(0, 120);
  const lines = [`  ${i + 1}. <${tag}${cls}> — "${comment}"`];
  if (sel) lines.push(`     selector: ${sel}`);
  if (a.screenshotPath) lines.push(`     screenshot: ${a.screenshotPath}`);
  if (a.element && a.element.sourceFile) lines.push(`     source: ${a.element.sourceFile}:${a.element.sourceLine || '?'}`);
  if (a.consoleErrors && a.consoleErrors.length) lines.push(`     consoleErrors: ${a.consoleErrors.length}`);
  if (a.networkErrors && a.networkErrors.length) lines.push(`     networkErrors: ${a.networkErrors.length}`);
  return lines.join('\n');
}

function fmtEvent(ev) {
  if (ev.type === 'batch') {
    const head = `[batch ${ev.batchId}] ${ev.annotations.length} annotation(s)`
      + (ev.sessionDescription ? `  session: "${ev.sessionDescription}"` : '');
    return [head, ...ev.annotations.map(fmtAnnotation)].join('\n');
  }
  if (ev.type === 'exit') return `[exit${ev.source ? ` source=${ev.source}` : ''}] — shutting down`;
  if (ev.type === 'timeout') return null;
  return `[${ev.type || 'unknown'}] ${JSON.stringify(ev)}`;
}

async function pollOnce(helper) {
  const url = `http://127.0.0.1:${helper.port}/poll?token=${encodeURIComponent(helper.token)}&timeout=600000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`poll HTTP ${res.status}`);
  return res.json();
}

async function killHelper(helper) {
  try {
    await fetch(`http://127.0.0.1:${helper.port}/exit?token=${encodeURIComponent(helper.token)}`, { method: 'POST' });
  } catch { /* helper may already be down */ }
  // Belt + suspenders: clear PID file if it lingers.
  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch { /* ignore */ }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write([
      'web-inspect manual test harness',
      '',
      '  node scripts/test.mjs               # default static port 7780 (auto-picks if busy)',
      '  node scripts/test.mjs --port 9090   # pin static port',
      '',
      'Boots the helper, serves scripts/test.html with the overlay injected,',
      'and prints poll events. Ctrl-C or the overlay\'s Stop button ends the session.',
      '',
    ].join('\n'));
    process.exit(0);
  }

  // If a stale helper is running, kill it before booting fresh — keeps test runs deterministic.
  if (fs.existsSync(PID_FILE)) {
    try {
      const stale = JSON.parse(fs.readFileSync(PID_FILE, 'utf-8'));
      if (stale && stale.port && stale.token) {
        await fetch(`http://127.0.0.1:${stale.port}/exit?token=${encodeURIComponent(stale.token)}`, { method: 'POST' }).catch(() => {});
      }
    } catch { /* ignore */ }
    try { fs.unlinkSync(PID_FILE); } catch { /* ignore */ }
  }

  const helper = bootHelper();
  const staticPort = await findOpenPort(args.port);
  const staticServer = await startStaticServer(staticPort, helper);

  const demoUrl = `http://127.0.0.1:${staticPort}/`;
  process.stdout.write([
    `helper:    127.0.0.1:${helper.port}  (pid ${helper.pid})`,
    `demo URL:  ${demoUrl}`,
    'open the demo URL in a browser, pin elements, type comments, click Send.',
    'Ctrl-C or click Stop in the overlay to end the session.',
    '',
  ].join('\n'));

  let stopping = false;
  const cleanup = async () => {
    if (stopping) return;
    stopping = true;
    process.stdout.write('\ncleaning up…\n');
    try { staticServer.close(); } catch { /* ignore */ }
    await killHelper(helper);
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  while (!stopping) {
    let ev;
    try { ev = await pollOnce(helper); }
    catch (err) {
      process.stdout.write(`poll error: ${err.message}\n`);
      await cleanup();
      return;
    }
    const line = fmtEvent(ev);
    if (line) process.stdout.write(line + '\n');
    if (ev.type === 'exit') { await cleanup(); return; }
  }
}

main().catch(async (err) => {
  process.stderr.write(`test harness failed: ${err.message}\n`);
  process.exit(1);
});
