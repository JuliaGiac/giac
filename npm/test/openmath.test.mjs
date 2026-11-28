// Tests of giac-wasm/openmath against the shared corpus of JuliaGiac/giac-openmath
// (test/fixtures/openmath-to-giac.json, copied by scripts/update-openmath.mjs at
// the commit src/openmath-table.mjs records).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadGiac } from '../src/index.mjs';
import { createGiacWorker } from '../src/worker.mjs';
import { giacSource, evalOpenMath, OpenMathConversionError, TABLE } from '../src/openmath.mjs';

const corpus = JSON.parse(readFileSync(new URL('./fixtures/openmath-to-giac.json', import.meta.url), 'utf8'));
const giac = await loadGiac();

// the same value in GIAC: they print the same, or their difference simplifies to 0
// (inside id(): a top-level "x=1" would assign x)
function same(result, value) {
  if (giac.eval(`id(${result})`) === giac.eval(`id(${value})`)) return true;
  try {
    return ['0', '0.0'].includes(giac.eval(`simplify((${result})-(${value}))`));
  } catch {
    return false;
  }
}

test('the corpus and the table are those of the same giac-openmath', () => {
  assert.equal(corpus.format, 1);
  assert.equal(TABLE.format, 2);
  assert.equal(corpus.table_commit, TABLE.commit);
});

for (const c of corpus.cases) {
  test(`corpus: ${c.name}`, async () => {
    if (c.value !== undefined) {
      const src = giacSource(c.om, c.options);
      assert.equal(typeof src, 'string');
      const { result, messages } = await evalOpenMath(giac, c.om, c.options);
      assert.ok(Array.isArray(messages));
      assert.ok(same(result, c.value), `${c.name}: ${src} gave ${result}, expected ${c.value}`);
    } else {
      const r = c.refused;
      await assert.rejects(evalOpenMath(giac, c.om, c.options), (e) => {
        assert.ok(e instanceof OpenMathConversionError, `${c.name}: ${e}`);
        assert.deepEqual(e.path, r.path);
        if (r.symbol) assert.equal(e.symbol, r.symbol);
        if (r.kind) assert.equal(e.kind, r.kind);
        if (r.reason_contains) assert.ok(e.reason.includes(r.reason_contains), `${c.name}: ${e.reason}`);
        return true;
      });
    }
  });
}

test('a variable named like a GIAC command is refused by evalOpenMath', async () => {
  const om = { kind: 'OMA', applicant: { kind: 'OMS', cd: 'arith1', name: 'plus' },
               arguments: [{ kind: 'OMV', name: 'sin' }, { kind: 'OMI', integer: 1 }] };
  assert.equal(typeof giacSource(om), 'string');     // giacSource has no session to ask
  await assert.rejects(evalOpenMath(giac, om), (e) =>
    e instanceof OpenMathConversionError && e.kind === 'OMV' && /command/.test(e.reason) &&
    JSON.stringify(e.path) === JSON.stringify(['arguments', 0]));
});

test('an OMOBJ wrapper is read, and a non-standard cdbase refused', async () => {
  const x = { kind: 'OMV', name: 'x' };
  const om = { kind: 'OMOBJ', object: { kind: 'OMA', applicant: { kind: 'OMS', cd: 'transc1', name: 'ln' }, arguments: [x] } };
  assert.equal((await evalOpenMath(giac, om)).result, 'ln(x)');
  const other = { kind: 'OMA', applicant: { kind: 'OMS', cd: 'transc1', name: 'ln', cdbase: 'http://example.org/cd' }, arguments: [x] };
  await assert.rejects(evalOpenMath(giac, other), OpenMathConversionError);
});

test('a GIAC error during evaluation rejects with a GiacError, not a refusal', async () => {
  const om = { kind: 'OMA', applicant: { kind: 'OMS', cd: 'arith1', name: 'divide' },
               arguments: [{ kind: 'OMI', integer: 1 }, { kind: 'OMS', cd: 'logic1', name: 'true' }] };
  const outcome = await evalOpenMath(giac, om).then(() => 'resolved', (e) => e);
  assert.ok(outcome === 'resolved' || !(outcome instanceof OpenMathConversionError));
});

test('evalOpenMath works with giac-wasm/worker too', async () => {
  const w = createGiacWorker();
  try {
    const om = { kind: 'OMA', applicant: { kind: 'OMS', cd: 'calculus1', name: 'defint' },
      arguments: [{ kind: 'OMA', applicant: { kind: 'OMS', cd: 'interval1', name: 'interval' },
                    arguments: [{ kind: 'OMI', integer: 0 }, { kind: 'OMI', integer: 1 }] },
                  { kind: 'OMBIND', binder: { kind: 'OMS', cd: 'fns1', name: 'lambda' },
                    variables: [{ kind: 'OMV', name: 'x' }],
                    object: { kind: 'OMA', applicant: { kind: 'OMS', cd: 'arith1', name: 'power' },
                              arguments: [{ kind: 'OMV', name: 'x' }, { kind: 'OMI', integer: 2 }] } }] };
    assert.equal((await evalOpenMath(w, om)).result, '1/3');
    await assert.rejects(evalOpenMath(w, { kind: 'OMV', name: 'diff' }), OpenMathConversionError);
  } finally {
    w.terminate();
  }
});

test('relation1.eq is an equation, never an assignment', async () => {
  // caseval reads a top-level "x=1" as x:=1; evalOpenMath must not
  const eq = (a, b) => ({ kind: 'OMA', applicant: { kind: 'OMS', cd: 'relation1', name: 'eq' }, arguments: [a, b] });
  const v = (n) => ({ kind: 'OMV', name: n });
  const one = { kind: 'OMI', integer: 1 };
  giac.eval('purge(eqx)');
  assert.equal((await evalOpenMath(giac, eq(v('eqx'), one))).result, 'eqx=1');
  assert.equal(giac.eval('eqx'), 'eqx');                       // not assigned
  // nested: an equation inside a sum is still not an assignment
  const plus = { kind: 'OMA', applicant: { kind: 'OMS', cd: 'arith1', name: 'plus' },
                 arguments: [eq(v('eqx'), one), eq(v('eqx'), one)] };
  await evalOpenMath(giac, plus);
  assert.equal(giac.eval('eqx'), 'eqx');
});

test('renaming a bound constant name leaves the input as it was', () => {
  const v = (n) => ({ kind: 'OMV', name: n });
  const lam = (x, body) => ({ kind: 'OMBIND', binder: { kind: 'OMS', cd: 'fns1', name: 'lambda' }, variables: [v(x)], object: body });
  const sum = (body) => ({ kind: 'OMA', applicant: { kind: 'OMS', cd: 'arith1', name: 'sum' },
    arguments: [{ kind: 'OMA', applicant: { kind: 'OMS', cd: 'interval1', name: 'integer_interval' },
                  arguments: [{ kind: 'OMI', integer: 1 }, v('n')] }, body] });
  const om = sum(lam('i', v('i')));
  const before = JSON.stringify(om);
  assert.match(giacSource(om), /\bi_1\b/);
  assert.doesNotMatch(giacSource(om), /\bi\b/);
  assert.equal(JSON.stringify(om), before);
  // nested bindings of i: two fresh names
  const nested = sum(lam('i', sum(lam('i', v('i')))));
  const src = giacSource(nested);
  assert.match(src, /\bi_1\b/);
  assert.match(src, /\bi_2\b/);
});

test('format 2: enable takes CD names of the table', () => {
  const x = { kind: 'OMV', name: 'x' };
  assert.throws(() => giacSource(x, { enable: ['no_such_cd'] }), TypeError);
  assert.throws(() => giacSource(x, { enable: 'giac_math1' }), TypeError);
  assert.equal(giacSource(x, { enable: ['giac_math1'] }), 'x');
});

test('format 2: a request in its envelope is not evaluated yet', async () => {
  const PB = 'https://juliagiac.github.io/giac-openmath/cd';
  const om = { kind: 'OMA', applicant: { kind: 'OMS', cd: 'scscp1', name: 'procedure_call' },
    arguments: [{ kind: 'OMA', applicant: { kind: 'OMS', cd: 'giac_procedures1', name: 'factor', cdbase: PB },
                  arguments: [{ kind: 'OMV', name: 'x' }] }] };
  const enable = ['scscp1', 'giac_procedures1'];
  await assert.rejects(evalOpenMath(giac, om, { enable }), (e) =>
    e instanceof OpenMathConversionError && e.symbol === 'scscp1.procedure_call' &&
    JSON.stringify(e.path) === '["applicant"]' && /does not evaluate requests/.test(e.reason));
  // prog1.assignment is a request too: out of its envelope, refused
  const sto = { kind: 'OMA', applicant: { kind: 'OMS', cd: 'prog1', name: 'assignment' },
                arguments: [{ kind: 'OMV', name: 'a' }, { kind: 'OMI', integer: 1 }] };
  assert.throws(() => giacSource(sto, { enable: ['prog1'] }), (e) =>
    e instanceof OpenMathConversionError && /procedure_call/.test(e.reason));
});

test('format 2: an OMOBJ cdbase is inherited', () => {
  const PB = 'https://juliagiac.github.io/giac-openmath/cd';
  const om = { kind: 'OMOBJ', cdbase: PB, object: { kind: 'OMA', applicant: { kind: 'OMS', cd: 'giac_math1', name: 'sign' },
                                                     arguments: [{ kind: 'OMV', name: 'x' }] } };
  assert.equal(giacSource(om, { enable: ['giac_math1'] }), 'sign(x)');
  assert.throws(() => giacSource(om), (e) => e instanceof OpenMathConversionError && /private/.test(e.reason));
});
