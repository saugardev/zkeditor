/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WasmImageProject } from '../src/wasm/img_editor_lib';

let wasmModule: any = null;

export async function initWasm(): Promise<typeof import('../src/wasm/img_editor_lib')> {
  if (wasmModule) return wasmModule;
  
  try {
    wasmModule = await import('../src/wasm/img_editor_lib');
    await wasmModule.default();
    return wasmModule;
  } catch (err) {
    console.error('Failed to load WASM module:', err);
    throw err;
  }
}

export async function createImageProject(): Promise<WasmImageProject> {
  const wasm = await initWasm();
  return new wasm.WasmImageProject();
} 