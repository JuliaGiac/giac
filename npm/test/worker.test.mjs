// Tests of giac-wasm/worker: Giac in a worker (a Web Worker in browsers,
// worker_threads in Node.js), driven with promises.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createGiacWorker } from '../src/worker.mjs';
import { GiacError } from '../src/index.mjs';

const workers = [];
function make(options) {
  const w = createGiacWorker(options);
  workers.push(w);
  return w;
}
after(() => workers.forEach((w) => w.terminate()));

test('the worker loads Giac and reports its version', async () => {
  const w = make();
  const { version } = await w.ready;
  assert.match(version, /^\d+\.\d+\.\d+$/);
});

test('eval and evalWithMessages give the result, and the messages apart', async () => {
  const w = make();
  assert.equal(await w.eval('factor(x^4-1)'), '(x-1)*(x+1)*(x^2+1)');
  const { result, messages } = await w.evalWithMessages('integrate(abs(x),x)');
  assert.match(result, /sign\(x\)/);
  assert.ok(messages.some((m) => /assumes constant sign/.test(m)));
});

test('calls sent before Giac has loaded are answered', async () => {
  const w = make();
  // no await on ready: these go out while the worker is still loading Giac
  const results = await Promise.all(['1+1', '2*3', 'factor(x^2-1)'].map((s) => w.eval(s)));
  assert.deepEqual(results, ['2', '6', '(x-1)*(x+1)']);
});

test('concurrent calls get their own results, in order', async () => {
  const w = make();
  await w.ready;
  const inputs = Array.from({ length: 20 }, (_, k) => `${k}^2`);
  const results = await Promise.all(inputs.map((s) => w.eval(s)));
  assert.deepEqual(results, inputs.map((_, k) => String(k * k)));
});

test('onMessage receives the messages of eval', async () => {
  const seen = [];
  const w = make({ onMessage: (m) => seen.push(m) });
  assert.equal(await w.eval('sqrt('), 'seq[]');
  assert.deepEqual(seen, ['Warning adding 1 ) at end of input']);
});

test('a GIAC error rejects with a GiacError that carries the messages', async () => {
  const w = make();
  await assert.rejects(w.eval('inv([[1,2],[2,4]])'), (e) => {
    assert.ok(e instanceof GiacError);
    assert.match(e.message, /Not invertible/);
    assert.equal(e.input, 'inv([[1,2],[2,4]])');
    assert.ok(Array.isArray(e.messages));
    return true;
  });
  assert.equal(await w.eval('1+1'), '2');
});

test('the time limit rejects a long evaluation, with the messages', async () => {
  const w = make({ timeout: 1 });
  await assert.rejects(w.eval('s:=0; for k from 1 to 10^10 do s:=s+k; od; s'), (e) => {
    assert.ok(e instanceof GiacError);
    assert.match(e.message, /interrupt/i);
    assert.ok(e.messages.some((m) => /Timeout/.test(m)));
    return true;
  });
  await w.setTimeout(15);
  assert.equal(await w.eval('1+1'), '2');
});

test('setTimeout rejects values GIAC does not take', async () => {
  const w = make();
  await assert.rejects(w.setTimeout(0), RangeError);
  await assert.rejects(w.setTimeout(24 * 60), RangeError);
});

test('interrupt stops an endless evaluation and starts a fresh session', async () => {
  const w = make();
  await w.eval('kept:=42');
  // GIAC never checks the time limit in this one: only interrupt stops it
  // their outcome is caught at once: they are rejected while interrupt() runs
  const outcome = (p) => p.then((v) => ({ value: v }), (error) => ({ error }));
  const endless = outcome(w.eval('f(n):=f(n-1)+1; f(3)'));
  const queued = outcome(w.eval('2+2'));
  await new Promise((r) => setTimeout(r, 1500));
  await w.interrupt();
  for (const { error } of [await endless, await queued]) {
    assert.ok(error instanceof GiacError);
    assert.match(error.message, /interrupted/i);
  }
  assert.equal(await w.eval('1+1'), '2');
  assert.equal(await w.eval('kept'), 'kept');          // the new session starts empty
});

test('the time limit set before an interrupt holds after it', async () => {
  const w = make({ timeout: 1 });
  await w.interrupt();
  await assert.rejects(w.eval('s:=0; for k from 1 to 10^10 do s:=s+k; od; s'), GiacError);
});

test('terminate stops for good', async () => {
  const w = make();
  await w.ready;
  w.terminate();
  await assert.rejects(w.eval('1+1'), /terminated/);
});

test('the input must be a string', async () => {
  const w = make();
  await assert.rejects(w.eval(42), TypeError);
});
