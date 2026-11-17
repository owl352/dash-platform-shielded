// Standalone orchard test — no pshenmic-dpp required.
// Verifies: orchard exports loadShielded(), which instantiates the proving module
// (native Node-API addon on Node, threaded wasm fallback; proving classes present,
// idempotent). Run: node test/standalone.test.mjs
import assert from 'node:assert/strict'
import { loadShielded } from '../dist/src/index.cjs'

assert.equal(typeof loadShielded, 'function', 'orchard must export loadShielded')

const shielded = loadShielded()
assert.ok(shielded.ShieldedBuilderNAPI, 'ShieldedBuilderNAPI must be present')
assert.ok(shielded.OrchardProverNAPI, 'OrchardProverNAPI must be present')
assert.ok(shielded.OrchardAddressNAPI, 'OrchardAddressNAPI must be present')
assert.equal(loadShielded(), shielded, 'loadShielded must be idempotent')

// Real proving-key build (~seconds) proves the module actually runs, not just loads.
const prover = await shielded.OrchardProverNAPI.init()
assert.ok(prover, 'OrchardProverNAPI.init() must resolve')

console.log('STANDALONE_OK: loadShielded export + proving module instantiation + proving key build')