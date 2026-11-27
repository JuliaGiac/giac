// Types of giac-wasm, the Giac computer algebra system compiled to WebAssembly.

/** An error GIAC reported while evaluating an input. */
export class GiacError extends Error {
  readonly name: 'GiacError';
  /** The input that failed. */
  readonly input: string;
  /** GIAC's messages while evaluating it. */
  readonly messages: string[];
}

/** One GIAC session in its own WebAssembly instance. */
export interface Giac {
  /** The version of GIAC, as "2.1.0". */
  readonly version: string;
  /**
   * Evaluate `input` in this session and return the result as text, as GIAC
   * prints it. GIAC's messages go to the `onMessage` callback. Throws a
   * GiacError if GIAC reports an error.
   */
  eval(input: string): string;
  /** Evaluate `input` and return the result with GIAC's messages apart. */
  evalWithMessages(input: string): { result: string; messages: string[] };
  /** Set the time limit of each evaluation, in seconds (0 < seconds < 1440). */
  setTimeout(seconds: number): void;
}

export interface LoadGiacOptions {
  /** Time limit of each evaluation, in seconds (default 15). */
  timeout?: number;
  /** Receives GIAC's messages during `eval`. */
  onMessage?: (line: string) => void;
  /** Where giac.wasm is, as for an Emscripten module. */
  locateFile?: (path: string, prefix: string) => string;
  /** The bytes of giac.wasm, to skip fetching it. */
  wasmBinary?: ArrayBuffer | Uint8Array;
}

/** Load GIAC in a new WebAssembly instance and return its session. */
export function loadGiac(options?: LoadGiacOptions): Promise<Giac>;
