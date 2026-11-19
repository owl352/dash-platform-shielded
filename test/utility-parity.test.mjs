// Part 1 Task 2 — parity of the ported napi boundary surface.
//
// The de-dup moved the base crate's small napi utilities into orchard
// (src/orchard/napi_utils.rs). Most of them (TryToU64, WithJsError, the
// pooling/distribution/platform-version parsers) are internal Rust helpers with
// no public JS surface — their parity is proven by the behavior-identical source
// port plus test/integration.test.mjs, which drives the WHOLE builder pipeline
// (every serializer + enum parser + BigIntString conversion) end-to-end.
//
// DynamicValue is the one ported utility that IS a public napi class. This test
// pins its JS surface to the exact behavior characterized from the base crate
// (src/dynamic_value/mod.rs): same getType() strings, same constructor
// conversion order (f64 before integers), same value round-trips, same
// fromBigIntString/isBigInt. Run on the rebuilt shielded wasm, no dpp required:
//   node test/utility-parity.test.mjs
import assert from 'node:assert/strict'
import { loadShielded } from '../dist/src/index.js'

const DV = loadShielded().DynamicValue
assert.ok(DV, 'the shielded module must expose the ported DynamicValue napi class')

const toHex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('')

// getType() + value round-trip matrix (expected values from the base crate).
const cases = [
  ['hello', 'String', 'hello'],
  [true, 'bool', true],
  [null, 'Null', null],
  [undefined, 'Undefined', undefined],
]
for (const [input, type, expected] of cases) {
  const dv = new DV(input)
  assert.equal(dv.getType(), type, `getType(${String(input)})`)
  assert.equal(dv.value, expected, `value(${String(input)})`)
}

// A JS number matches f64 FIRST in the constructor (base behavior), so it is
// stored as f64, not an integer type.
const num = new DV(42)
assert.equal(num.getType(), 'f64', 'plain number is f64 (constructor order)')
assert.equal(num.value, 42)

// Bytes round-trip exactly.
const bytes = new DV(new Uint8Array([1, 2, 3, 255]))
assert.equal(bytes.getType(), 'Vec<u8>')
assert.equal(toHex(bytes.value), '010203ff')

// Named constructors land in their exact integer/float variants.
assert.equal(DV.fromInt(5).getType(), 'i64')
assert.equal(DV.fromInt(5).value, 5)
assert.equal(DV.fromUInt(5).getType(), 'u32')
assert.equal(DV.fromUInt(5).value, 5)
assert.equal(DV.fromFloat(1.5).getType(), 'f64')
assert.equal(DV.fromFloat(1.5).value, 1.5)

// BigIntString: stored as a string, isBigInt true, value round-trips.
const big = DV.fromBigIntString('18446744073709551615')
assert.equal(big.getType(), 'BigIntString')
assert.equal(big.isBigInt(), true)
assert.equal(big.value, '18446744073709551615')
assert.equal(new DV('x').isBigInt(), false)

// Object / array variants.
const obj = new DV({ a: DV.fromUInt(1) })
assert.equal(obj.getType(), 'BTreeMap')
assert.equal(obj.value.a.getType(), 'u32')
const arr = new DV([DV.fromUInt(1), DV.fromUInt(2)])
assert.equal(arr.getType(), 'Vec')
assert.equal(arr.value.length, 2)

console.log('UTILITY_PARITY_OK: ported DynamicValue matches the base napi surface')