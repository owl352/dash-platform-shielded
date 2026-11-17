// pshenmic-orchard entry. Exports loadShielded(), which returns the proving
// module instance (native Node-API addon on Node, threaded wasm elsewhere). The
// consumer provides it to pshenmic-dpp explicitly:
//   import { loadShielded } from 'pshenmic-orchard'
//   import { setShielded } from 'pshenmic-dpp'
//   setShielded(loadShielded())
// Both imports are static, so this survives bundler renaming. No global registry
// is involved — the consumer wires the two packages together.
//
// In a wasm thread worker loader.cjs exports null, so loadShielded is undefined.
const loader = require('../binaries/loader.cjs');
const loadShielded = loader != null ? loader.loadShielded : undefined;

module.exports = { loadShielded };