// dash-platform-shielded entry. Eagerly loads the proving module (native Node-API
// addon on Node, threaded wasm elsewhere) and exports its NAPI surface. Pass it
// to pshenmic-dpp explicitly:
//   import shielded from 'dash-platform-shielded'
//   import { setShielded } from 'pshenmic-dpp'
//   setShielded(shielded)
//
// This package is opt-in: installing it means the app uses shielded proving, so
// loading at import is intentional. Only import it where proving is available:
// Node, or a cross-origin-isolated browser (the wasm path needs SharedArrayBuffer).
// For deferred loading (non-isolated pages, SSR, tests, wasm thread workers) use
// 'dash-platform-shielded/lazy' and call loadShielded() when ready.
//
// In a wasm thread worker loader.cjs exports null; there is no proving module to
// expose there, so export an empty namespace instead of throwing at import.
const loader = require('../binaries/loader.cjs');
const loadShielded = loader != null ? loader.loadShielded : undefined;

module.exports = loadShielded != null ? loadShielded() : {};