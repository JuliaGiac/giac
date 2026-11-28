// giac-wasm/openmath: OpenMath (the OpenMath 2.0 JSON encoding) to GIAC, through
// the giac-openmath table (https://github.com/JuliaGiac/giac-openmath), embedded
// in openmath-table.mjs at a commit. The input contract is recorded on
// JuliaGiac/giac#22; the shared corpus of giac-openmath tests it.
//
//   giacSource(om, { exact })          GIAC input text, not evaluated
//   evalOpenMath(giac, om, { exact })  { result, messages }, from a session of
//                                      loadGiac() or a createGiacWorker()
//
// What the table refuses or does not list throws an OpenMathConversionError
// with the table's reason and the JSON path of the node, rather than a guess.
//
// Giac is (c) Bernard Parisse and Renee De Graeve, Institut Fourier,
// Universite Grenoble Alpes. This package is part of the JuliaGiac fork of
// Giac and, like Giac, is distributed under the GNU General Public License,
// version 3 or later.

import TABLE from './openmath-table.mjs';

export { TABLE };

/** OpenMath that has no GIAC form here: what the table refuses or does not list. */
export class OpenMathConversionError extends Error {
  constructor(reason, { path = [], symbol, kind } = {}) {
    super(`${reason} (at ${JSON.stringify(path)})`);
    this.name = 'OpenMathConversionError';
    /** Why: the table's reason for a refused symbol, or what is missing. */
    this.reason = reason;
    /** The JSON path of the refused node, from the root object (0-based indices). */
    this.path = path;
    /** The refused symbol, `cd.name`, if a symbol is refused. */
    this.symbol = symbol;
    /** The refused node's kind (`OMV`, `OMI`, `OMA`…), if not a symbol. */
    this.kind = kind;
  }
}

const STANDARD_CDBASE = 'http://www.openmath.org/cd';
const WHERE = `giac-openmath at ${TABLE.commit.slice(0, 7)}`;
// names GIAC reads as one of its constants (as Giac.jl's fresh identifiers)
const RESERVED = new Set(['D', 'i', 'I', 'e', 'pi', 'infinity', 'inf', 'undef', 'euler_gamma', 'true', 'false']);
const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;

const direction = (e) => e.direction ?? 'both';
const isPlaceholder = (x) => typeof x === 'string' && x.startsWith('#');

// the key of an OpenMath pattern or object: its head symbol, "apply:" and the
// head of an applied application, or "bind:" and the binder
function patternKey(p) {
  if (typeof p === 'string') return p;
  if (p[0] === 'apply') return 'apply:' + patternKey(p[1]);
  if (p[0] === 'bind') return 'bind:' + p[1];
  return p[0];
}
const symbolKey = (o) => `${o.cd}.${o.name}`;
function objectKey(o) {
  if (o.kind === 'OMS') return symbolKey(o);
  if (o.kind === 'OMA') {
    if (o.applicant.kind === 'OMS') return symbolKey(o.applicant);
    if (o.applicant.kind === 'OMA' && o.applicant.applicant.kind === 'OMS') return 'apply:' + symbolKey(o.applicant.applicant);
  }
  if (o.kind === 'OMBIND' && o.binder.kind === 'OMS') return 'bind:' + symbolKey(o.binder);
  return '';
}

const FROM_LEAF = new Map(TABLE.leaf.filter((l) => direction(l) !== 'to_openmath').map((l) => [l.om, l.giac]));
const REFUSED = new Map(TABLE.refused.filter((r) => r.om).map((r) => [r.om, r.reason]));
const FROM_MAPS = new Map();
for (const m of TABLE.map) {
  if (direction(m) === 'to_openmath') continue;
  const k = patternKey(m.om);
  if (!FROM_MAPS.has(k)) FROM_MAPS.set(k, []);
  FROM_MAPS.get(k).push(m);
}
// symbols the table reads somewhere, to tell "refused here" from "unknown"
const KNOWN = new Set([...FROM_LEAF.keys(), ...FROM_MAPS.keys()].map((k) => k.replace(/^(apply|bind):/, '')));

function standard(o) {
  return o.cdbase === undefined || o.cdbase === STANDARD_CDBASE;
}

// does object o match OpenMath pattern p, binding placeholders in env
function match(p, o, env) {
  if (typeof p === 'number') return o.kind === 'OMI' && integerText(o) === String(p);
  if (typeof p === 'string') {
    if (isPlaceholder(p)) return bind(env, p, o);
    return o.kind === 'OMS' && standard(o) && symbolKey(o) === p;
  }
  if (p[0] === 'apply') return o.kind === 'OMA' && match(p[1], o.applicant, env) && matchArgs(p.slice(2), o.arguments, env);
  if (p[0] === 'bind') {
    if (o.kind !== 'OMBIND' || !match(p[1], o.binder, env) || o.variables.length !== p[2].length) return false;
    return p[2].every((v, i) => o.variables[i].kind === 'OMV' && bind(env, v, { kind: 'OMV', name: o.variables[i].name }))
      && match(p[3], o.object, env);
  }
  return o.kind === 'OMA' && match(p[0], o.applicant, env) && matchArgs(p.slice(1), o.arguments, env);
}
function matchArgs(ps, args, env) {
  if (ps.length && ps[ps.length - 1] === '#*') {
    const n = ps.length - 1;
    if (args.length <= n) return false;
    if (!ps.slice(0, n).every((p, i) => match(p, args[i], env))) return false;
    env['#*'] = args.slice(n).map((a, i) => ({ node: a, index: n + i }));
    return true;
  }
  return ps.length === args.length && ps.every((p, i) => match(p, args[i], env));
}
function bind(env, p, o) {
  if (p in env) return JSON.stringify(env[p]) === JSON.stringify(o);
  env[p] = o;
  return true;
}

function integerText(o) {
  if (o.integer !== undefined) return Number.isSafeInteger(o.integer) ? String(o.integer) : null;
  if (typeof o.decimal === 'string' && /^-?\d+$/.test(o.decimal)) return o.decimal;
  if (typeof o.hexadecimal === 'string' && /^-?[0-9a-fA-F]+$/.test(o.hexadecimal)) {
    const neg = o.hexadecimal.startsWith('-');
    const v = BigInt('0x' + o.hexadecimal.replace('-', ''));
    return (neg ? '-' : '') + v.toString();
  }
  return null;
}
const parens = (t) => (t.startsWith('-') ? `(${t})` : t);

class Writer {
  constructor(options) {
    this.exact = !!options?.exact;
    this.names = new Map();      // variable name => its path, for the command check
  }

  source(o, path) {
    switch (o?.kind) {
      case 'OMI': {
        const t = integerText(o);
        if (t === null) {
          const why = o.integer !== undefined
            ? 'an integer that is not a safe integer: give it as "decimal", a string'
            : 'a malformed integer';
          throw new OpenMathConversionError(why, { path, kind: 'OMI' });
        }
        return parens(t);
      }
      case 'OMF': {
        if (this.exact) throw new OpenMathConversionError('a float, refused in exact mode', { path, kind: 'OMF' });
        let t;
        if (typeof o.float === 'number' && Number.isFinite(o.float)) t = String(o.float);
        else if (typeof o.decimal === 'string' && /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(o.decimal)) t = o.decimal;
        if (t === undefined) throw new OpenMathConversionError('a float with no finite decimal form', { path, kind: 'OMF' });
        return parens(t);
      }
      case 'OMV': {
        const n = o.name;
        if (typeof n !== 'string' || !IDENTIFIER.test(n)) {
          throw new OpenMathConversionError(`the variable ${JSON.stringify(n)} is not a GIAC identifier`, { path, kind: 'OMV' });
        }
        if (RESERVED.has(n)) {
          throw new OpenMathConversionError(`the variable ${n} is a GIAC constant: GIAC would read it as that constant`, { path, kind: 'OMV' });
        }
        if (!this.names.has(n)) this.names.set(n, path);
        return n;
      }
      case 'OMS': {
        const s = symbolKey(o);
        if (!standard(o)) throw new OpenMathConversionError(`no GIAC form for ${s} of the CD base ${o.cdbase}`, { path, symbol: s });
        if (FROM_LEAF.has(s)) return FROM_LEAF.get(s);
        throw this.refusal(s, path);
      }
      case 'OMA':
      case 'OMBIND':
        return this.compound(o, path);
      default:
        throw new OpenMathConversionError(`no GIAC form for an OpenMath ${o?.kind ?? 'value'}`, { path, kind: o?.kind });
    }
  }

  refusal(s, path) {
    if (REFUSED.has(s)) return new OpenMathConversionError(REFUSED.get(s), { path, symbol: s });
    return new OpenMathConversionError(`no GIAC form for ${s} in ${WHERE}`, { path, symbol: s });
  }

  compound(o, path) {
    if (o.kind === 'OMA' && o.applicant.kind === 'OMS' && standard(o.applicant)) {
      const s = symbolKey(o.applicant);
      // the number constructors, which the table leaves to the leaf conventions
      if (s === 'nums1.rational' && o.arguments.length === 2) {
        const [p, q] = o.arguments.map((a, i) => this.source(a, [...path, 'arguments', i]));
        return `(${p}/${q})`;
      }
      if (s === 'complex1.complex_cartesian' && o.arguments.length === 2) {
        const [a, b] = o.arguments.map((x, i) => this.source(x, [...path, 'arguments', i]));
        return `((${a})+(${b})*i)`;
      }
    }
    const key = objectKey(o);
    for (const m of FROM_MAPS.get(key) ?? []) {
      const env = {};
      if (match(m.om, o, env)) return this.write(m, env, path, o);
    }
    // why not: a refused or unknown head symbol, or a known one in another shape
    const head = o.kind === 'OMA' ? o.applicant : o.binder;
    const headPath = [...path, o.kind === 'OMA' ? 'applicant' : 'binder'];
    if (head.kind === 'OMS') {
      const s = symbolKey(head);
      if (!standard(head)) throw new OpenMathConversionError(`no GIAC form for ${s} of the CD base ${head.cdbase}`, { path: headPath, symbol: s });
      if (!KNOWN.has(s)) throw this.refusal(s, headPath);
    }
    const what = key ? key.replace(/^(apply|bind):/, '') : 'this application';
    throw new OpenMathConversionError(`no GIAC form for ${what} with these arguments in ${WHERE}`, { path, kind: o.kind });
  }

  // GIAC input of an entry's GIAC pattern, its placeholders written from env
  write(m, env, path, o) {
    const [head, ...pattern] = m.giac;
    const args = [];
    for (const a of pattern) {
      if (a === '#*') args.push(...env['#*'].map(({ node, index }) => this.source(node, this.locate(o, node, path, index))));
      else if (isPlaceholder(a)) args.push(this.source(env[a], this.locate(o, env[a], path)));
      else args.push(String(a));
    }
    const name = head.trim();
    const input = m.input ?? 'call';
    if (input === 'call') return `${name}(${args.join(', ')})`;
    if (input === 'prefix' || args.length === 1) return `${name}(${args[0]})`;
    return args.map((a) => `(${a})`).join(` ${name} `);
  }

  // the path of a node bound by a pattern, found in the object (for refusals inside it)
  locate(o, node, path, index) {
    const found = find(o, node, path);
    return found ?? (index !== undefined ? [...path, 'arguments', index] : path);
  }
}

function find(o, target, path) {
  if (o === target) return path;
  if (o && typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      const r = find(v, target, [...path, Array.isArray(o) ? Number(k) : k]);
      if (r) return r;
    }
  }
  return null;
}

function root(om) {
  return om?.kind === 'OMOBJ' ? om.object : om;
}

/** GIAC input text of the OpenMath object `om`, not evaluated. */
export function giacSource(om, options) {
  return new Writer(options).source(root(om), []);
}

/**
 * Evaluate the OpenMath object `om` in `giac`, a session of loadGiac() or a
 * createGiacWorker(): resolves to `{ result, messages }`. Rejects with an
 * OpenMathConversionError for what has no GIAC form here (including a
 * variable named like a GIAC command), or a GiacError for GIAC's own errors.
 */
export async function evalOpenMath(giac, om, options) {
  const w = new Writer(options);
  const src = w.source(root(om), []);
  for (const [name, path] of w.names) {
    // `type('name')` is "identifier" for a free name, "func" for a command; it fails
    // on a keyword (mod, …)
    const t = await Promise.resolve()
      .then(() => giac.evalWithMessages(`type('${name}')`))
      .then((r) => r.result, () => null);
    if (t !== 'identifier') {
      throw new OpenMathConversionError(`the variable ${name} is a GIAC command or keyword: GIAC would read it as one`, { path, kind: 'OMV' });
    }
  }
  // id(...): caseval reads a top-level "=" as an assignment (x=1 sets x), and an
  // OpenMath relation1.eq is an equation
  return giac.evalWithMessages(`id(${src})`);
}
