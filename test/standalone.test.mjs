// Standalone orchard test — no pshenmic-dpp required.
// Verifies: importing orchard registers the loader on the global symbol, and
// loadShielded() instantiates the threaded proving wasm (proving classes present,
// idempotent). Run: node test/standalone.test.mjs  (Node provides SharedArrayBuffer).
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const KEY = Symbol.for('pshenmic-dpp.shielded')

delete globalThis[KEY]
require('../dist/src/index.cjs')

assert.equal(typeof globalThis[KEY]?.loadShielded, 'function', 'orchard must register loadShielded')

const shielded = globalThis[KEY].loadShielded()
assert.ok(shielded.ShieldedBuilderNAPI, 'ShieldedBuilderNAPI must be present')
assert.ok(shielded.OrchardProverNAPI, 'OrchardProverNAPI must be present')
assert.ok(shielded.OrchardAddressNAPI, 'OrchardAddressNAPI must be present')
assert.equal(globalThis[KEY].loadShielded(), shielded, 'loadShielded must be idempotent')

// Real proving-key build (~seconds) proves the wasm actually runs, not just loads.
const prover = await shielded.OrchardProverNAPI.init()
assert.ok(prover, 'OrchardProverNAPI.init() must resolve')

console.log('STANDALONE_OK: registration + shielded wasm instantiation + proving key build')
