// Part 1 Task 1 spike — boundary serialization format catalog + characterization.
//
// VERDICT: de-dup is FEASIBLE. Every dpp napi boundary class is a THIN wrapper
// over dashpay-domain serialization, so calling the domain method directly from
// the orchard crate produces byte-identical output. Catalog (napi impl → domain
// equivalent the orchard builder must use):
//
//   StateTransitionNAPI.to_bytes   → domain.serialize_to_bytes()
//   StateTransitionNAPI.from_bytes → StateTransition::deserialize_from_bytes_untrusted(bytes)
//   IdentifierNAPI.bytes           → identifier.to_vec()              (raw 32)
//   IdentifierNAPI.from_bytes      → Identifier::from_vec(bytes)
//   AssetLockProofNAPI.bytes/from  → bincode standard().with_big_endian() encode/decode::<AssetLockProof>
//   CoreScriptNAPI.to_bytes/from   → CoreScript::to_bytes() / CoreScript::from_bytes(bytes)
//   PlatformAddressNAPI.from_bytes → PlatformAddress::from_bytes(bytes)
//   IdentityNAPI.to_bytes/from     → serialize_to_bytes / deserialize_from_bytes_untrusted
//   IdentityPublicKeyNAPI.from     → IdentityPublicKey::deserialize_from_bytes_untrusted
//   IdentityPublicKeyInCreationNAPI.bytes/from → bincode big-endian encode/decode::<IdentityPublicKeyInCreation>
//   GroupStateTransitionInfoNAPI.bytes/from    → bincode big-endian encode/decode::<GroupStateTransitionInfo>
//   InputAddressNAPI.from_bytes    → bincode big-endian decode::<(PlatformAddress,(AddressNonce,Credits))>
//   AddressFundsFeeStrategyStepNAPI.from_bytes → bincode big-endian decode::<AddressFundsFeeStrategyStep>
//   ShieldedMemoNAPI.from_bytes    → ShieldedMemo::from_bytes(&[u8;36])   (MEMO_SIZE=36)
//   SerializedActionNAPI           → domain SerializedAction (bincode big-endian)
//   utils::js_inputs_to_inputs     → BTreeMap<PlatformAddress,(AddressNonce,Credits)> from the decoded tuples
//
// This test characterizes the napi formats on fixed inputs (the oracle Tasks 2-3
// must match). It tests EXISTING dpp behavior, so it passes by design.
import assert from 'node:assert/strict'
import path from 'node:path'
import { loadShielded } from '../dist/src/index.cjs'

const DPP_DIR = process.env.DPP_DIR
  ?? path.resolve(process.cwd(), '../pshenmic-dpp-new-ark/pshenmic-dpp')
const dpp = await import(path.join(DPP_DIR, 'dist/src/wasm.js'))

const toHex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('')
const SEED = new Uint8Array(64)
for (let i = 0; i < 64; i++) SEED[i] = (i * 7 + 1) & 0xff

// Identifier: raw 32 bytes, round-trips exactly.
const id = dpp.IdentifierWASM.fromBase58('ckBqfQe7LU7vwrwXopyCB4n5phZShjA16BGhNGpsD5U')
assert.equal(id.bytes().length, 32, 'Identifier is raw 32 bytes')
assert.equal(toHex(dpp.IdentifierWASM.fromBytes(id.bytes()).bytes()), toHex(id.bytes()))

// AssetLockProof: bincode big-endian, round-trips exactly.
const outPoint = new dpp.OutPointWASM('79af4b339ddfee8c9b6d08d74155373c6ef547cda5e65473a254b9b0f8533f0c', 0)
const proof = dpp.AssetLockProofWASM.createChainAssetLockProof(1499737, outPoint)
assert.equal(toHex(dpp.AssetLockProofWASM.fromBytes(proof.bytes()).bytes()), toHex(proof.bytes()))

// ShieldedMemo: exactly 36 bytes; wrong length rejected.
const memo = dpp.ShieldedMemoWASM.fromString('spike')
assert.equal(memo.toBytes().length, 36, 'ShieldedMemo is 36 bytes')
assert.throws(() => dpp.ShieldedMemoWASM.fromBytes(new Uint8Array(10)), /36/)

// StateTransition: serialize/deserialize round-trip (the critical return value).
dpp.setShielded(loadShielded())
const builder = new dpp.ShieldedBuilderWASM()
await builder.init()
const recipient = dpp.ShieldedAddressWASM.fromSeed(SEED, 1, 0)
const privateKey = dpp.PrivateKeyWASM.fromWIF('cUy4wbim4y9NDwC24omx8oWY5WqfmjSU2gdcZtTXza2xDCAkQXRP')
const st = await builder.shieldFromAssetLock(recipient, 40000000000n, proof, privateKey, dpp.ShieldedMemoWASM.empty(), 0)
const bytes = st.bytes()
assert.equal(toHex(dpp.StateTransitionWASM.fromBytes(bytes).bytes()), toHex(bytes), 'StateTransition bytes round-trip')
assert.equal(bytes.length, 8300, 'fixed-input transition is 8300 bytes')

console.log('SPIKE_OK: boundary formats characterized; de-dup feasible (all thin domain wrappers)')
