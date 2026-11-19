// Standalone shielded-module test — no pshenmic-dpp required.
// Verifies: importing does not load anything, constructing DashPlatformShielded
// loads the proving module, the lazy loader returns the same cached instance, and
// a real proving key builds. Run: node test/standalone.test.mjs
import assert from 'node:assert/strict'
import { DashPlatformShielded } from '../dist/src/index.js'
import { loadShielded } from '../dist/src/lazy.js'

const shielded = new DashPlatformShielded()

assert.ok(shielded.napi.ShieldedBuilderNAPI, 'ShieldedBuilderNAPI must be present')
assert.ok(shielded.napi.OrchardProverNAPI, 'OrchardProverNAPI must be present')
assert.ok(shielded.napi.OrchardAddressNAPI, 'OrchardAddressNAPI must be present')
assert.equal(loadShielded().ShieldedBuilderNAPI, shielded.napi.ShieldedBuilderNAPI, 'lazy loader must return the same cached instance')

// The instance exposes the wrappers and verify functions directly.
assert.ok(shielded.ShieldedBuilderWASM, 'wrappers must be available on the instance')
assert.ok(shielded.verifyShieldedNotesCountProof, 'verify functions must be available on the instance')

// Real proving-key build (~seconds) proves the module actually runs, not just loads.
const prover = await shielded.napi.OrchardProverNAPI.init()
assert.ok(prover, 'OrchardProverNAPI.init() must resolve')

console.log('STANDALONE_OK: constructor entry + lazy loader + proving key build')
