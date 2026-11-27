// giac-wasm: the Giac computer algebra system compiled to WebAssembly.
//
// A thin layer over GIAC's caseval entry point: one GIAC session per loaded
// instance, results as text, errors as GiacError, GIAC's messages apart from
// the result, and GIAC's time limit.
//
// Giac is (c) Bernard Parisse and Renee De Graeve, Institut Fourier,
// Universite Grenoble Alpes. This package is part of the JuliaGiac fork of
// Giac and, like Giac, is distributed under the GNU General Public License,
// version 3 or later.

import createGiacModule from '../dist/giac.mjs';

/** An error GIAC reported while evaluating an input. */
export class GiacError extends Error {
  constructor(message, { input, messages = [] } = {}) {
    super(message);
    this.name = 'GiacError';
    /** The input that failed. */
    this.input = input;
    /** GIAC's messages while evaluating it. */
    this.messages = messages;
  }
}

// Inputs caseval reads as commands to itself instead of evaluating them
// (src/gen.cc); `caseval contextptr` even returns a pointer as text.
const CONTROL_WORDS = new Set([
  'caseval contextptr', 'shell on', 'shell off', 'warn on', 'warn off',
  'init geogebra', 'close geogebra', 'ckcount',
]);
const CONTROL_PREFIXES = ['timeout ', 'ckevery ', 'ckbudget '];

// GIAC takes a time limit t with 0 <= t < 24*60 seconds; 0 would interrupt
// everything at once.
const MAX_TIMEOUT = 24 * 60;
// How often GIAC looks at the clock: every CHECK_EVERY of its interruption
// checks. Without it, the time limit is never checked.
const CHECK_EVERY = 10000;

const ERROR_PREFIX = 'GIAC_ERROR:';

function checkTimeout(seconds) {
  if (typeof seconds !== 'number' || !(seconds > 0 && seconds < MAX_TIMEOUT)) {
    throw new RangeError(`the time limit must be a number of seconds in ]0, ${MAX_TIMEOUT}[, got ${seconds}`);
  }
}

/** One GIAC session in its own WebAssembly instance. */
class Giac {
  #caseval;
  #collect;
  #onMessage;
  #broken = false;

  constructor(caseval, collect, onMessage) {
    this.#caseval = caseval;
    this.#collect = collect;
    this.#onMessage = onMessage;
    this.#caseval(`ckevery ${CHECK_EVERY}`);
    const banner = this.#caseval('version()');
    /** The version of GIAC, as "2.1.0". */
    this.version = (banner.match(/giac (\d+\.\d+\.\d+)/) ?? [])[1] ?? banner;
  }

  /**
   * Evaluate `input` in this session and return the result as text, as
   * GIAC prints it. GIAC's messages go to the `onMessage` callback given to
   * `loadGiac`. Throws a GiacError if GIAC reports an error.
   */
  eval(input) {
    const { result, messages } = this.#run(input);
    if (this.#onMessage) messages.forEach((m) => this.#onMessage(m));
    return result;
  }

  /**
   * Evaluate `input` and return `{ result, messages }`, with GIAC's messages
   * (warnings, notes on the method used) apart from the result. Throws a
   * GiacError if GIAC reports an error.
   */
  evalWithMessages(input) {
    return this.#run(input);
  }

  /**
   * Set the time limit of each evaluation, in seconds (0 < seconds < 1440;
   * 15 by default). Past it, the evaluation throws a GiacError.
   */
  setTimeout(seconds) {
    checkTimeout(seconds);
    this.#caseval(`timeout ${seconds}`);
  }

  #run(input) {
    if (typeof input !== 'string') {
      throw new TypeError(`the input must be a string, got ${typeof input}`);
    }
    if (CONTROL_WORDS.has(input) || CONTROL_PREFIXES.some((p) => input.startsWith(p))) {
      throw new TypeError(`"${input}" is a command to caseval itself, not an expression`);
    }
    if (this.#broken) {
      throw new Error('this GIAC instance stopped after a WebAssembly trap; load a new one');
    }
    let result;
    const messages = this.#collect(() => {
      try {
        result = this.#caseval(input);
      } catch (e) {
        if (e instanceof WebAssembly.RuntimeError) this.#broken = true;
        throw e;
      }
    });
    if (result.startsWith(ERROR_PREFIX)) {
      throw new GiacError(result.slice(ERROR_PREFIX.length).trim(), { input, messages });
    }
    if (result.startsWith('gl3d')) {
      throw new GiacError('3D plots are not supported by giac-wasm', { input, messages });
    }
    return { result, messages };
  }
}

/**
 * Load GIAC in a new WebAssembly instance and return its session.
 *
 * Options:
 * - `timeout`: time limit of each evaluation, in seconds (default 15).
 * - `onMessage(line)`: receives GIAC's messages during `eval`.
 * - `locateFile(path, prefix)`, `wasmBinary`: passed to the Emscripten
 *   module, to say where giac.wasm is or to give its bytes.
 */
export async function loadGiac({ timeout = 15, onMessage, locateFile, wasmBinary } = {}) {
  checkTimeout(timeout);
  let sink = null;
  const route = (line) => {
    if (sink) sink.push(line);
    else if (onMessage) onMessage(line);
  };
  const module = await createGiacModule({
    print: route,
    printErr: route,
    ...(locateFile && { locateFile }),
    ...(wasmBinary && { wasmBinary }),
  });
  const caseval = module.cwrap('caseval', 'string', ['string']);
  // run f and return the lines GIAC printed meanwhile
  const collect = (f) => {
    const lines = [];
    sink = lines;
    try {
      f();
    } finally {
      sink = null;
    }
    return lines;
  };
  const giac = new Giac(caseval, collect, onMessage);
  giac.setTimeout(timeout);
  return giac;
}
