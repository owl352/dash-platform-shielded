// Standalone shielded-module test — no pshenmic-dpp required.
// Verifies: the default entry eagerly exposes the proving module (native
// Node-API addon on Node, threaded wasm fallback; proving classes present), the
// lazy entry returns the same cached instance, and a real proving key builds.
// Run: node test/standalone.test.mjs
import assert from 'node:assert/strict'
import shielded from '../dist/src/index.cjs'
import { loadShielded } from '../dist/src/lazy.cjs'

assert.ok(shielded.ShieldedBuilderNAPI, 'ShieldedBuilderNAPI must be present')
assert.ok(shielded.ShieldedProverNAPI, 'ShieldedProverNAPI must be present')
assert.ok(shielded.ShieldedAddressNAPI, 'ShieldedAddressNAPI must be present')
assert.equal(loadShielded(), shielded, 'lazy loader must return the same cached instance')

// Real proving-key build (~seconds) proves the module actually runs, not just loads.
const prover = await shielded.ShieldedProverNAPI.init()
assert.ok(prover, 'ShieldedProverNAPI.init() must resolve')

console.log('STANDALONE_OK: eager entry + lazy loader + proving key build')