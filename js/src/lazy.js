// Deferred entry for dash-platform-shielded. Importing the wrappers does not load
// the proving module; it is instantiated on first use (or explicitly with
// loadShielded()). Use this for non-cross-origin-isolated browsers, SSR, tests,
// or wasm thread workers:
//   import { ShieldedBuilderWASM, loadShielded } from 'dash-platform-shielded/lazy'
export * from '../ts/index.js'
