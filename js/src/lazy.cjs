// Deferred entry for dash-platform-shielded. Nothing is loaded until loadShielded()
// is called. Use this for non-cross-origin-isolated browsers, SSR, tests, or
// wasm thread workers, then pass the result to pshenmic-dpp's setShielded():
//   import { loadShielded } from 'dash-platform-shielded/lazy'
//   setShielded(loadShielded())
const loader = require('../binaries/loader.cjs');
const loadShielded = loader != null ? loader.loadShielded : undefined;

module.exports = { loadShielded };