// giac-wasm/worker: Giac in a worker, driven with promises, so that evaluations
// do not block the page (a module Web Worker in browsers, worker_threads in
// Node.js).
//
//   const w = createGiacWorker({ timeout: 15 });
//   await w.ready;                          // { version }
//   await w.eval('factor(x^4-1)');          // the result as text
//   await w.evalWithMessages(input);        // { result, messages }
//   await w.setTimeout(5);
//   await w.interrupt();                    // hard stop: a fresh session
//   w.terminate();                          // stop for good
//
// GIAC's time limit stops most long evaluations; a few of GIAC's evaluators
// never check it, and only interrupt() stops them: it terminates the worker,
// rejects the pending calls and starts a fresh, empty session.
//
// Giac is (c) Bernard Parisse and Renee De Graeve, Institut Fourier,
// Universite Grenoble Alpes. This package is part of the JuliaGiac fork of
// Giac and, like Giac, is distributed under the GNU General Public License,
// version 3 or later.

import { GiacError, checkTimeout } from './errors.mjs';

const isNode = typeof process !== 'undefined' && !!process.versions?.node &&
  typeof WorkerGlobalScope === 'undefined' && typeof window === 'undefined';

// A worker with the same small interface in browsers and in Node.js.
async function spawn(url, onMessage, onFailure) {
  if (isNode) {
    const { Worker } = await import('node:worker_threads');
    const w = new Worker(url);
    w.on('message', onMessage);
    w.on('error', onFailure);
    w.on('exit', (code) => { if (code !== 0) onFailure(new Error(`the Giac worker exited with code ${code}`)); });
    return { post: (m) => w.postMessage(m), stop: () => w.terminate() };
  }
  const w = new Worker(url, { type: 'module' });
  w.onmessage = (e) => onMessage(e.data);
  w.onerror = (e) => { e.preventDefault?.(); onFailure(new Error(e.message || 'the Giac worker failed')); };
  return { post: (m) => w.postMessage(m), stop: () => w.terminate() };
}

function toError(e) {
  if (e.name === 'GiacError') return new GiacError(e.message, { input: e.input, messages: e.messages });
  if (e.name === 'TypeError') return new TypeError(e.message);
  if (e.name === 'RangeError') return new RangeError(e.message);
  return new Error(e.message);
}

class GiacWorker {
  #url;
  #timeout;
  #onMessage;
  #worker = null;          // a promise of the spawned worker
  #pending = new Map();    // id => { resolve, reject }
  #nextId = 0;
  #ready;
  #terminated = false;
  #generation = 0;         // which worker a message comes from, across restarts

  constructor({ timeout = 15, workerUrl, onMessage } = {}) {
    checkTimeout(timeout);
    this.#timeout = timeout;
    this.#url = workerUrl ?? new URL('./worker-entry.mjs', import.meta.url);
    this.#onMessage = onMessage;
    this.#start();
  }

  /** Resolves to `{ version }` when Giac has loaded in the worker. */
  get ready() {
    return this.#ready;
  }

  #start() {
    const generation = ++this.#generation;
    let resolveReady, rejectReady;
    this.#ready = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
    this.#ready.catch(() => {});      // a failure also reaches each call
    const onMessage = (msg) => {
      if (generation !== this.#generation) return;
      if (msg.type === 'ready') return resolveReady({ version: msg.version });
      if (msg.type === 'fatal') {
        const e = new Error(`Giac failed to load: ${msg.error}`);
        rejectReady(e);
        return this.#rejectAll(e);
      }
      const call = this.#pending.get(msg.id);
      if (!call) return;
      this.#pending.delete(msg.id);
      if (msg.type === 'result') call.resolve({ result: msg.result, messages: msg.messages });
      else call.reject(toError(msg.error));
    };
    const onFailure = (e) => {
      if (generation !== this.#generation) return;
      rejectReady(e);
      this.#rejectAll(e);
    };
    this.#worker = spawn(this.#url, onMessage, onFailure).then((w) => {
      w.post({ type: 'init', timeout: this.#timeout });
      return w;
    });
    this.#worker.catch(onFailure);
  }

  #rejectAll(error) {
    const calls = [...this.#pending.values()];
    this.#pending.clear();
    calls.forEach((c) => c.reject(error));
  }

  #call(message) {
    if (this.#terminated) return Promise.reject(new Error('the Giac worker was terminated'));
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#worker.then((w) => w.post({ ...message, id }), reject);
    });
  }

  /**
   * Evaluate `input` and resolve to the result as text. GIAC's messages go to
   * the `onMessage` option. Rejects with a GiacError if GIAC reports an error
   * (its `messages` hold what GIAC said).
   */
  async eval(input) {
    const { result, messages } = await this.evalWithMessages(input);
    if (this.#onMessage) messages.forEach((m) => this.#onMessage(m));
    return result;
  }

  /** Evaluate `input` and resolve to `{ result, messages }`. */
  evalWithMessages(input) {
    if (typeof input !== 'string') {
      return Promise.reject(new TypeError(`the input must be a string, got ${typeof input}`));
    }
    return this.#call({ type: 'eval', input });
  }

  /** Set GIAC's time limit of each evaluation, in seconds (0 < seconds < 1440). */
  async setTimeout(seconds) {
    checkTimeout(seconds);
    await this.#call({ type: 'setTimeout', seconds });
    this.#timeout = seconds;
  }

  /**
   * Stop whatever runs: terminate the worker, reject the pending calls with a
   * GiacError, and start a fresh session (its variables are gone; the time
   * limit is kept). Resolves when the new session is ready.
   */
  interrupt() {
    if (this.#terminated) return Promise.reject(new Error('the Giac worker was terminated'));
    const old = this.#worker;
    this.#rejectAll(new GiacError('interrupted: the Giac session was restarted and its state cleared'));
    this.#start();
    old.then((w) => w.stop(), () => {});
    return this.ready;
  }

  /** Stop the worker for good; pending calls are rejected. */
  terminate() {
    if (this.#terminated) return;
    this.#terminated = true;
    this.#generation++;
    this.#rejectAll(new Error('the Giac worker was terminated'));
    this.#worker.then((w) => w.stop(), () => {});
  }
}

/** Load Giac in a new worker. See the module's comment for the API. */
export function createGiacWorker(options) {
  return new GiacWorker(options);
}

export { GiacError };
