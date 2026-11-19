# dash-platform-shielded

The shielded (Orchard/Halo 2) engine for
[`pshenmic-dpp`](https://github.com/owl352/pshenmic-dpp), as a **separate
repository**. It owns the complete shielded surface: proving, the Orchard data
classes, the shielded state-transition wrappers, and GroveDB shielded-pool
verification. The base package stays small and loads **without cross-origin
isolation**.

## How it plugs in

This package is completely independent of `pshenmic-dpp`. Importing it does not
load anything; create an instance when shielded proving is needed and pass it to
the SDK:

```js
import { DashPlatformShielded } from 'dash-platform-shielded'
import { DashPlatformSDK } from 'dash-platform-sdk'

const sdk = new DashPlatformSDK({
  network: 'mainnet',
  shielded: new DashPlatformShielded()   // loads the proving module here
})

const builder = await sdk.shielded.init()
```

The constructor loads the proving module: native Node-API addon on Node, threaded
wasm elsewhere. Only construct it where proving is available: Node, or a
cross-origin-isolated browser (the wasm path needs `SharedArrayBuffer`).

The instance exposes the wrappers and verify functions directly, and the raw NAPI
surface via `.napi`. For deferred loading — non-isolated pages, SSR, tests, or wasm
thread workers — use the lazy entry:

```js
import { loadShielded } from 'dash-platform-shielded/lazy'

const napi = loadShielded()            // loads now, not at import
```

The base ↔ proving boundary is **bytes**: dpp base classes are serialized into
the shielded builder (separate napi instances never share wrapped napi objects).
On Node, the module is the native Node-API addon (~3x faster proving); in browsers
— or when the addon is unavailable for the platform — it is the threaded wasm,
which needs cross-origin isolation (SharedArrayBuffer).

## Repository split

This crate owns the **complete shielded engine**:

- proving bindings (`src/orchard/`: builder, prover, address/note/viewing-key/
  commitment-tree/spendable-note/shielded-output, multi-transfer, signer, note
  recovery, `enums/scope`);
- shielded pool verification (`src/verify/shielded/`: encrypted notes, anchors,
  most-recent anchor, pool state, notes count, nullifiers);
- the TypeScript wrappers (`js/ts/`: Orchard structs, shielded transitions,
  verify functions).

The proving core is **self-contained**: it serializes the dashpay `dpp` domain
types directly (`src/orchard/serialize.rs` + `napi_utils.rs`). The TS wrappers
compose the base `pshenmic-dpp` classes (the package is optional; dpp never
imports it).

`pshenmic-dpp` keeps its base protocol and the low-level shielded transition NAPI
primitives used by its state-transition/batch code. It has no dependency on this
package and does not re-export it.

## Layout

```
src/            Rust crate source (pure Rust)
  orchard/      heavy proving napi bindings + napi_utils/serialize (domain-direct)
  enums/scope.rs
  lib.rs        #![no_main] pub mod orchard/enums
js/             JS source (copied to dist/, mirroring pshenmic-dpp's layout)
  src/          entry API: index.js (DashPlatformShielded) + lazy.js -> dist/src/
  ts/           TypeScript wrappers + verify functions -> dist/ts/
  binaries/     napi glue: loader.cjs (loadShielded), memory.cjs (shared memory),
                base122.cjs (decoder) -> dist/binaries/
utils/          imported build helpers: convertBinary, buildWorkerBundle, base122,
                genTypings (napi --dts)
scripts/        standalone scripts: wasm-opt.sh
Cargo.toml      deps: dashpay dpp (shielded-client), grovedb-commitment-tree,
                zip32, napi, ... (self-contained; no pshenmic-dpp dependency)
build.rs        napi-build setup + reactor crt (_initialize)
build.cjs       builds shielded wasm + worker bundle + napi typings into dist/
dist/           published package (self-contained, like dpp) — BUILD OUTPUT:
                src/ (API) + binaries/ (napi glue + native/<target>/*.node +
                wasm/shieldedBytes.cjs + wasm/workerBundle.cjs + bindingsTypes.d.ts)
test/           standalone / utility-parity (no dpp) + integration /
                serialization-equivalence (dpp + shielded)
```

## Building

Prerequisites:
- Rust `nightly-2026-08-15` + `wasm32-wasip1-threads` target + `rust-src`
  (`rustup toolchain install nightly-2026-08-15 --component rust-src --target wasm32-wasip1-threads`).
  Must stay on a 1.99 nightly: from 1.100 rustc links `crt1-reactor.o` itself,
  colliding with napi-build 2.3's copy (duplicate `_initialize`).
- `clang` + `llvm-ar` (wasm C deps + emnapi link archive).
- For cross native targets: `cargo-zigbuild` (linux) + `cargo-xwin` (windows,
  `XWIN_ACCEPT_LICENSE=1`). The crate is self-contained against the dashpay `dpp`
  domain library — no pshenmic-dpp checkout is needed.

```sh
npm install
npm run build        # wasm + native (all targets) + typings + bundle -> dist/
BUILD_STEPS=wasm npm run build        # just the threaded wasm
BUILD_STEPS=native NATIVE_BUILD_TARGET=aarch64-apple-darwin npm run build  # one addon
```

The native Node-API addon is preferred on Node (~3x faster proving); the threaded
wasm is the browser path / fallback (the loader picks native when available).
`wasm-opt -Oz` is mandatory (unoptimized is >8MB; Chrome's sync-compile limit is
8MB). `npm run build:dist` only copies js → dist (no rebuild); `npm run build:typings`
regenerates `dist/binaries/bindingsTypes.d.ts`.

## Testing

Two levels (plain Node scripts — Node provides `SharedArrayBuffer`):

```sh
npm test                 # standalone: DashPlatformShielded + lazy loader + wasm/native instantiation + proving-key build (no dpp)
npm run test:integration # dpp base + shielded wrappers: a REAL shielded transition across the boundary
```

`test:integration` needs a **built** pshenmic-dpp (`dist/` with the base wasm);
point `DPP_DIR` at it (default: sibling checkout). It asserts deterministic
transition fields + byte round-trips (proofs are OsRng-randomized, so literal
proof bytes are never compared).

Testing strategy for the split: test **each side strictly** — the shielded module
standalone (real proving), dpp base + the shielded wrappers (the wrappers can be exercised
against a **mock** shielded NAPI surface, no real proving needed) —
plus this cross-repo integration test. In browsers, proving additionally needs
cross-origin isolation (`COOP: same-origin` + `COEP: require-corp`); the dpp e2e
harness covers the COOP/popup matrix.

## Notes

- **Version alignment:** the bytes boundary couples dpp and dash-platform-shielded —
  release them with matching versions and matching `@emnapi` pins (currently
  `1.11.3`). The `version` here is a placeholder (`0.0.0`); set it at release.
- **Wasm size:** the shielded wasm links the dpp base napi helpers (it uses them
  for serialization), so it is ~8MB (currently 7.99MB — tight headroom under
  Chrome's limit). The *base* dpp wasm is the small one. Watch the shielded size
  budget; a future step could gate dpp's napi registration to shrink it.
- `binaries/`, `dist/`, `target/` are build outputs (gitignored); CI builds them
  before publishing. Do not publish from a stale local `dist/`.