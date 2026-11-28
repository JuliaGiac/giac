// Types of giac-wasm/openmath: OpenMath (OpenMath 2.0 JSON encoding) to GIAC,
// through the giac-openmath table.

/** An OpenMath object in the OpenMath 2.0 JSON encoding. */
export type OMObject =
  | { kind: 'OMOBJ'; object: OMObject; openmath?: string }
  | { kind: 'OMA'; applicant: OMObject; arguments: OMObject[] }
  | { kind: 'OMBIND'; binder: OMObject; variables: { kind: 'OMV'; name: string }[]; object: OMObject }
  | { kind: 'OMS'; cd: string; name: string; cdbase?: string }
  | { kind: 'OMV'; name: string }
  | { kind: 'OMI'; integer?: number; decimal?: string; hexadecimal?: string }
  | { kind: 'OMF'; float?: number; decimal?: string; hexadecimal?: string }
  | { kind: string; [key: string]: unknown };

export interface OpenMathOptions {
  /** Refuse floats (OMF). */
  exact?: boolean;
}

/** OpenMath that has no GIAC form here: what the table refuses or does not list. */
export class OpenMathConversionError extends Error {
  readonly name: 'OpenMathConversionError';
  /** Why: the table's reason for a refused symbol, or what is missing. */
  readonly reason: string;
  /** The JSON path of the refused node, from the root object (0-based indices). */
  readonly path: (string | number)[];
  /** The refused symbol, `cd.name`, if a symbol is refused. */
  readonly symbol?: string;
  /** The refused node's kind (`OMV`, `OMI`, `OMA`…), if not a symbol. */
  readonly kind?: string;
}

/** Anything with evalWithMessages: a loadGiac() session or a createGiacWorker(). */
export interface GiacEvaluator {
  evalWithMessages(input: string): { result: string; messages: string[] } | Promise<{ result: string; messages: string[] }>;
}

/** The embedded giac-openmath table, with the commits it comes from. */
export const TABLE: { source: string; commit: string; sha256: string; format: number; [key: string]: unknown };

/** GIAC input text of the OpenMath object, not evaluated. */
export function giacSource(om: OMObject, options?: OpenMathOptions): string;

/** Evaluate the OpenMath object in GIAC: the result and GIAC's messages. */
export function evalOpenMath(giac: GiacEvaluator, om: OMObject, options?: OpenMathOptions): Promise<{ result: string; messages: string[] }>;
