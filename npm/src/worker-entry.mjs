// The code that runs in the worker created by createGiacWorker (worker.mjs): a
// module Web Worker in browsers, a worker_threads Worker in Node.js. It loads
// Giac and answers the main thread's requests, one at a time, as GIAC runs.
//
// Requests are listened for before Giac has loaded, so none sent meanwhile is
// lost: each one waits for Giac.
//
// Protocol (structured-clone messages):
//   main -> worker  { type: 'init', timeout }
//                   { type: 'eval', id, input }
//                   { type: 'setTimeout', id, seconds }
//   worker -> main  { type: 'ready', version }
//                   { type: 'fatal', error }
//                   { type: 'result', id, result, messages }
//                   { type: 'error', id, error: { name, message, input, messages } }

import { loadGiac } from './index.mjs';

let giac = null;
let resolveInit;
const init = new Promise((r) => { resolveInit = r; });
let send;

async function handle(msg) {
  if (msg.type === 'init') {
    try {
      giac = await loadGiac({ timeout: msg.timeout });
      send({ type: 'ready', version: giac.version });
    } catch (e) {
      send({ type: 'fatal', error: String(e && e.message || e) });
    }
    resolveInit();
    return;
  }
  await init;
  if (!giac) {
    send({ type: 'error', id: msg.id, error: { name: 'Error', message: 'Giac failed to load', messages: [] } });
    return;
  }
  try {
    if (msg.type === 'eval') {
      const { result, messages } = giac.evalWithMessages(msg.input);
      send({ type: 'result', id: msg.id, result, messages });
    } else if (msg.type === 'setTimeout') {
      giac.setTimeout(msg.seconds);
      send({ type: 'result', id: msg.id, result: null, messages: [] });
    }
  } catch (e) {
    send({
      type: 'error',
      id: msg.id,
      error: { name: e.name, message: e.message, input: e.input, messages: e.messages ?? [] },
    });
  }
}

// Requests are handled in order: the next starts when the previous has answered
let queue = Promise.resolve();
const receive = (msg) => { queue = queue.then(() => handle(msg)); };

if (typeof WorkerGlobalScope !== 'undefined' && typeof self !== 'undefined') {
  // a Web Worker: listen at once, before any await
  send = (m) => self.postMessage(m);
  self.onmessage = (e) => receive(e.data);
} else {
  // Node.js worker_threads: messages wait in the port until a listener is attached
  const { parentPort } = await import('node:worker_threads');
  send = (m) => parentPort.postMessage(m);
  parentPort.on('message', receive);
}
