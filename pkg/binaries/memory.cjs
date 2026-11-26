// Shared memory for the SHIELDED (threaded) wasm: wasm threads require a
// shared WebAssembly.Memory, i.e. SharedArrayBuffer / cross-origin isolation
// in browsers. Only required by loader.cjs's wasm path, not at require time.
//
// The wasm imports env.memory with min 1006 pages, so `initial` must be at
// least that or instantiation fails. 1024 pages (64 MiB) keeps the round
// number the loader documents and leaves headroom.
const sharedMemory = new WebAssembly.Memory({
  initial: 1024,
  maximum: 12000,
  shared: true
});

module.exports.default = sharedMemory;
