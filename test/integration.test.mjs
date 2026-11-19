// Integration test — pshenmic-dpp (base) + the shielded proving module across
// the repo boundary. Verifies the bytes boundary still works when the module is
// a separate package: dpp base classes marshal to bytes into the shielded
// builder, which proves a real shielded transition. Run: node test/integration.test.mjs
//
// Requires a built pshenmic-dpp (dist/ with the base wasm). Point DPP_DIR at it
// (default: sibling checkout). Node provides SharedArrayBuffer.
import assert from 'node:assert/strict'
import path from 'node:path'

const DPP_DIR = process.env.DPP_DIR
  ?? path.resolve(process.cwd(), '../pshenmic-dpp-new-ark/pshenmic-dpp')

import { DashPlatformShielded } from '../dist/src/index.js'

const dpp = await import(path.join(DPP_DIR, 'dist/src/native.js'))
const shielded = new DashPlatformShielded()

const seed = new Uint8Array(64)
for (let i = 0; i < 64; i++) seed[i] = (i * 7 + 1) & 0xff
const toHex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('')

const builder = new shielded.ShieldedBuilderWASM()
await builder.init()
const recipient = shielded.OrchardAddressWASM.fromSeed(seed, 1, 0)
const privateKey = dpp.PrivateKeyWASM.fromWIF('cUy4wbim4y9NDwC24omx8oWY5WqfmjSU2gdcZtTXza2xDCAkQXRP')
const outPoint = new dpp.OutPointWASM('79af4b339ddfee8c9b6d08d74155373c6ef547cda5e65473a254b9b0f8533f0c', 0)
const assetLockProof = dpp.AssetLockProofWASM.createChainAssetLockProof(1499737, outPoint)
const memo = shielded.ShieldedMemoWASM.empty()

const st = await builder.shieldFromAssetLock(recipient, 40000000000n, assetLockProof, privateKey, memo, 0)
const t = shielded.ShieldFromAssetLockTransitionWASM.fromStateTransition(st)

assert.equal(t.valueBalance, 40000000000n, 'valueBalance')
assert.equal(toHex(t.assetLockProof.bytes()), toHex(assetLockProof.bytes()), 'assetLockProof round-trips across the boundary')
assert.ok(t.actions.length >= 1, 'has actions')
assert.equal(t.bindingsSignature.length, 64, 'bindings signature')
const bytes = st.bytes()
assert.equal(toHex(dpp.StateTransitionWASM.fromBytes(bytes).bytes()), toHex(bytes), 'state transition bytes round-trip')

console.log(`INTEGRATION_OK: dpp+shielded proved a ${bytes.length}-byte shielded transition across the repo boundary`)
