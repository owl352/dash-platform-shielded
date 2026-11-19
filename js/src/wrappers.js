// Lazy wrappers entry: exposes the shielded wrappers without instantiating the
// proving module. The provider loads it on first use (native on Node, threaded
// wasm elsewhere).
export * from '../ts/index.js'
