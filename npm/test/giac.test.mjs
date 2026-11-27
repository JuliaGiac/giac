// Tests of the giac-wasm JavaScript API, run with `node --test` after `just wasm`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGiac, GiacError } from '../src/index.mjs';

const giac = await loadGiac();

test('the module loads and reports the GIAC version', () => {
  assert.match(giac.version, /^\d+\.\d+\.\d+$/);
});

test('eval returns the result as text', () => {
  assert.equal(giac.eval('factor(x^4-1)'), '(x-1)*(x+1)*(x^2+1)');
  assert.equal(giac.eval('integrate(1/(1+x^2),x)'), 'atan(x)');
  assert.equal(giac.eval('evalf(pi,30)'), '3.14159265358979323846264338328');
  assert.equal(giac.eval('latex(x^2/2)'), '"\\frac{x^{2}}{2}"');
});

test('exact results come without an appended approximation', () => {
  assert.equal(giac.eval('ln(-1)'), 'i*pi');
  assert.equal(giac.eval('2^70'), '1180591620717411303424');
  assert.equal(giac.eval('sum(1/k^2,k,1,inf)'), '1/6*pi^2');
});

test('the session keeps its variables', () => {
  giac.eval('wasmtest_a:=5');
  assert.equal(giac.eval('wasmtest_a+1'), '6');
  giac.eval('purge(wasmtest_a)');
  assert.equal(giac.eval('wasmtest_a+1'), 'wasmtest_a+1');
});

test('a GIAC error throws a GiacError with its message', () => {
  assert.throws(() => giac.eval('inv([[1,2],[2,4]])'), (e) => {
    assert.ok(e instanceof GiacError);
    assert.match(e.message, /Not invertible/);
    assert.equal(e.input, 'inv([[1,2],[2,4]])');
    return true;
  });
  assert.equal(giac.eval('1+1'), '2'); // still usable afterwards
});

test('evalWithMessages returns the messages apart from the result', () => {
  const { result, messages } = giac.evalWithMessages('sqrt(');
  assert.equal(result, 'seq[]');
  assert.deepEqual(messages, ['Warning adding 1 ) at end of input']);
  assert.deepEqual(giac.evalWithMessages('1+1'), { result: '2', messages: [] });
});

test('messages of eval go to onMessage, not to the console', async () => {
  const seen = [];
  const g = await loadGiac({ onMessage: (m) => seen.push(m) });
  assert.equal(g.eval('sqrt('), 'seq[]');
  assert.deepEqual(seen, ['Warning adding 1 ) at end of input']);
});

test('a 2D plot is an SVG image', () => {
  assert.match(giac.eval('plot(sin(x),x)'), /^"?<svg /);
});

test('a 3D plot throws, as there is no renderer', () => {
  assert.throws(() => giac.eval('plot3d(x*y,x,y)'), GiacError);
});

test('the time limit interrupts a long evaluation', () => {
  const g = giac;
  g.setTimeout(1);
  const t0 = Date.now();
  assert.throws(() => g.eval('s:=0; for k from 1 to 10^10 do s:=s+k; od; s'), (e) => {
    assert.ok(e instanceof GiacError);
    assert.match(e.message, /interrupt/i);
    return true;
  });
  assert.ok(Date.now() - t0 < 10000);
  g.setTimeout(15);
  assert.equal(g.eval('factor(x^2-1)'), '(x-1)*(x+1)');
});

test('setTimeout rejects values GIAC does not take', () => {
  assert.throws(() => giac.setTimeout(-1), RangeError);
  assert.throws(() => giac.setTimeout(24 * 60), RangeError);
});

test('two instances do not share their session', async () => {
  const g1 = await loadGiac();
  const g2 = await loadGiac();
  g1.eval('wasmtest_b:=1');
  assert.equal(g2.eval('wasmtest_b'), 'wasmtest_b');
});

test('the input must be a string, and not one of caseval\'s control words', () => {
  assert.throws(() => giac.eval(42), TypeError);
  assert.throws(() => giac.eval('caseval contextptr'), TypeError);
  assert.throws(() => giac.eval('timeout 3'), TypeError);
});
