// Types of giac-wasm/worker: Giac in a worker, driven with promises.
import { GiacError } from './index.js';
export { GiacError };

export interface GiacWorkerOptions {
  /** Time limit of each evaluation, in seconds (default 15), kept across interrupt(). */
  timeout?: number;
  /** Receives GIAC's messages during `eval`. */
  onMessage?: (line: string) => void;
  /** Where the worker's script is, if not next to this module (worker-entry.mjs). */
  workerUrl?: string | URL;
}

/** Giac in a worker (a module Web Worker in browsers, worker_threads in Node.js). */
export interface GiacWorker {
  /** Resolves to the version of Giac when it has loaded in the worker. */
  readonly ready: Promise<{ version: string }>;
  /** Evaluate `input`; resolves to the result as text, rejects with a GiacError. */
  eval(input: string): Promise<string>;
  /** Evaluate `input`; resolves to the result and GIAC's messages apart. */
  evalWithMessages(input: string): Promise<{ result: string; messages: string[] }>;
  /** Set the time limit of each evaluation, in seconds (0 < seconds < 1440). */
  setTimeout(seconds: number): Promise<void>;
  /** Terminate what runs, reject the pending calls, start a fresh session. */
  interrupt(): Promise<{ version: string }>;
  /** Stop the worker for good. */
  terminate(): void;
}

/** Load Giac in a new worker. */
export function createGiacWorker(options?: GiacWorkerOptions): GiacWorker;
