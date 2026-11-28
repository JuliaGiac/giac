// What the giac-wasm modules share without loading Giac: the error GIAC reports,
// and the range of its time limit. Kept apart so that giac-wasm/worker can use
// them on the main thread, where the WebAssembly module is never loaded.

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

// GIAC takes a time limit t with 0 <= t < 24*60 seconds; 0 would interrupt
// everything at once.
export const MAX_TIMEOUT = 24 * 60;

export function checkTimeout(seconds) {
  if (typeof seconds !== 'number' || !(seconds > 0 && seconds < MAX_TIMEOUT)) {
    throw new RangeError(`the time limit must be a number of seconds in ]0, ${MAX_TIMEOUT}[, got ${seconds}`);
  }
}
