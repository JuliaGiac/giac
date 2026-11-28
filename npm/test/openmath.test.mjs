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
  assert.equal(TABLE.format, 1);
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
