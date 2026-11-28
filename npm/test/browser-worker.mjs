// giac-wasm/worker in a browser (Chromium, through Playwright), under a strict
// Content Security Policy: a page loads createGiacWorker as a module, and the
// worker is a module Web Worker. Not a `node --test` file: Playwright is not a
// dependency of the package.
//
//   npm install --no-save playwright && npx playwright install chromium
//   node test/browser-worker.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'";
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };

const PAGE = `<!doctype html><meta charset="utf-8"><script type="module" src="/test/page.mjs"></script>`;
const SCRIPT = `
import { createGiacWorker, GiacError } from '/src/worker.mjs';
const out = {};
try {
  const w = createGiacWorker({ timeout: 2 });
  out.early = await w.eval('1+1');                       // sent before Giac has loaded
  out.version = (await w.ready).version;
  out.factor = await w.eval('factor(x^4-1)');
  const m = await w.evalWithMessages('integrate(abs(x),x)');
  out.messages = m.messages.length;
  try { await w.eval('inv([[1,2],[2,4]])'); } catch (e) { out.error = e instanceof GiacError && /Not invertible/.test(e.message); }
  try { await w.eval('s:=0; for k from 1 to 10^10 do s:=s+k; od; s'); } catch (e) { out.timeout = e instanceof GiacError && e.messages.some((x) => /Timeout/.test(x)); }
  const endless = w.eval('f(n):=f(n-1)+1; f(3)').catch((e) => e instanceof GiacError && /interrupted/.test(e.message));
  await new Promise((r) => setTimeout(r, 1000));
  await w.interrupt();
  out.interrupted = await endless;
  out.after = await w.eval('2+2');
  w.terminate();
} catch (e) { out.failure = String(e); }
window.result = out;
`;

const server = createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const headers = { 'content-security-policy': CSP };
  if (url === '/') return res.writeHead(200, { ...headers, 'content-type': 'text/html' }).end(PAGE);
  if (url === '/test/page.mjs') return res.writeHead(200, { ...headers, 'content-type': 'text/javascript' }).end(SCRIPT);
  try {
    const path = normalize(join(ROOT, url));
    if (!path.startsWith(ROOT)) throw new Error('outside');
    const body = await readFile(path);
    res.writeHead(200, { ...headers, 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(String(e)));
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.result, null, { timeout: 120000 });
const r = await page.evaluate(() => window.result);
await browser.close();
server.close();

const expected = { early: '2', factor: '(x-1)*(x+1)*(x^2+1)', error: true, timeout: true, interrupted: true, after: '4' };
const bad = Object.entries(expected).filter(([k, v]) => r[k] !== v);
if (r.failure || bad.length || !(r.messages > 0) || problems.length) {
  console.error('FAIL', JSON.stringify({ result: r, mismatches: bad, problems }));
  process.exit(1);
}
console.log('ok   giac-wasm/worker in Chromium under a strict CSP:', JSON.stringify(r));
