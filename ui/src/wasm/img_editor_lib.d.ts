/* tslint:disable */
/* eslint-disable */
/**
*/
export class WasmImageProject {
  free(): void;
/**
*/
  constructor();
/**
* @param {Uint8Array} image_data
*/
  add_layer(image_data: Uint8Array): void;
/**
* @param {number} index
* @param {any} transformation
*/
  transform_layer(index: number, transformation: any): void;
/**
* @param {number} index
* @param {string | undefined} [format]
* @returns {Uint8Array}
*/
  get_layer(index: number, format?: string): Uint8Array;
/**
* @param {number} width
* @param {number} height
*/
  add_empty_layer(width: number, height: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmimageproject_free: (a: number) => void;
  readonly wasmimageproject_new: () => number;
  readonly wasmimageproject_add_layer: (a: number, b: number, c: number, d: number) => void;
  readonly wasmimageproject_transform_layer: (a: number, b: number, c: number, d: number) => void;
  readonly wasmimageproject_get_layer: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly wasmimageproject_add_empty_layer: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
