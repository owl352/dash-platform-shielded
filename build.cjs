// Builds the dash-platform-shielded package: the shielded Orchard/Halo 2 proving
// engine as native Node-API addons (preferred on Node, ~3x faster than wasm)
// AND a threaded wasm module (browser / fallback), plus the napi TypeScript
// declarations. Published layout mirrors pshenmic-dpp: dist/src (API) +
// dist/binaries (napi glue + native/<target>/*.node + wasm/*.cjs + typings).
//
// BUILD_STEPS selects what to build, so CI can run the slow parts as parallel
// jobs and assemble the package afterwards. Default: everything.
//   wasm     threaded wasm (wasm32-wasip1-threads, nightly) -> binaries/wasm/
//              shieldedBytes.cjs + workerBundle.cjs. Sync-compiled at the eager
//              entry / loadShielded(); MUST stay < 8MB (Chrome sync-compile limit).
//   native   NATIVE_BUILD_TARGET addons -> binaries/native/<target>/*.node
//   typings  napi typings (host build) -> binaries/bindingsTypes.d.ts
//   bundle   copy js/ -> dist/ (src API + binaries napi glue)
//
// Requires: nightly-2026-08-15 + wasm32-wasip1-threads + rust-src for wasm;
// cargo-zigbuild (linux) / cargo-xwin (windows) for cross native; clang/llvm-ar;
// the emnapi devDependency (wasm link archive + worker builds). See README.md.

const fs = require("node:fs");
const path = require("node:path");
const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const { convertBinary } = require("./utils/convertBinary.mjs");
const { buildWorkerBundle } = require("./utils/buildWorkerBundle.mjs");
const { genTypings } = require("./utils/genTypings.mjs");

const execTask = promisify(exec);
const ROOT = __dirname;

const buildProfile = process.env.PROFILE ?? "release";
const isRelease = buildProfile === "release";
const WASM_TOOLCHAIN = process.env.WASM_TOOLCHAIN ?? "nightly-2026-08-15";
// Release wasm uses the size-optimized release-wasm profile (Cargo.toml).
const WASM_PROFILE = isRelease ? "release-wasm" : buildProfile;
const BIN_NAME = "dash_platform_shielded";
// Chrome refuses to sync-compile wasm > 8MB on the main thread; the shielded
// module is sync-compiled at the eager entry / loadShielded(), so the limit
// applies here too.
const CHROME_SYNC_COMPILE_LIMIT = 8 * 1024 * 1024;

const distDir = path.join(ROOT, "dist");
const binariesOutputDir = path.join(distDir, "binaries");
const wasmOutputDir = path.join(binariesOutputDir, "wasm");

const emnapiLinkDir = path.join(require.resolve("emnapi"), "..", "lib", "wasm32-wasi-threads");
const targetWasmFile = path.join(ROOT, "target", "wasm32-wasip1-threads", WASM_PROFILE, `${BIN_NAME}.wasm`);

const specificTarget = process.env.NATIVE_BUILD_TARGET;
const nativeTargets = specificTarget
  ? specificTarget.split(",").map((t) => t.trim())
  : [
      "x86_64-apple-darwin",
      "aarch64-apple-darwin",
      "x86_64-unknown-linux-gnu",
      "aarch64-unknown-linux-gnu",
      "x86_64-unknown-linux-musl",
      "aarch64-unknown-linux-musl",
      "x86_64-pc-windows-msvc",
      "aarch64-pc-windows-msvc",
    ];

// Dynamic CRT linking: cargo-zigbuild DROPS the cdylib crate type for musl
// targets under the default static CRT ("dropping unsupported crate type
// `cdylib`"), so no .so/.node is produced. -crt-static keeps the musl cdylib
// (and matches the windows dynamic-CRT build). dpp's CI sets this via env;
// defaulting it here makes a local `yarn build` produce every target too.
const nativeRustflags = process.env.RUSTFLAGS ?? "-C target-feature=-crt-static";

const ALL_STEPS = ["wasm", "native", "typings", "bundle"];
const buildSteps = new Set(
  (process.env.BUILD_STEPS ?? "wasm,native,typings,bundle").split(",").map((s) => s.trim()),
);
for (const step of buildSteps) {
  if (!ALL_STEPS.includes(step)) {
    throw new Error(`unknown BUILD_STEPS entry "${step}", expected: ${ALL_STEPS.join(", ")}`);
  }
}

async function main() {
  if (buildSteps.has("wasm")) await buildWasm();
  if (buildSteps.has("native")) await buildNative();
  if (buildSteps.has("typings")) await genTypings();
  if (buildSteps.has("bundle")) bundle();

  console.log("Done");
}

async function buildWasm() {
  console.log("--- Building shielded WASM (wasm32-wasip1-threads) ---");
  // Fresh link before wasm-opt: never opt(opt(wasm)).
  fs.rmSync(targetWasmFile, { force: true });

  await execTask(
    `cargo +${WASM_TOOLCHAIN} build --target wasm32-wasip1-threads -Z unstable-options -Z build-std=std,panic_abort -Z build-std-features=optimize_for_size --profile ${WASM_PROFILE}`,
    {
      cwd: ROOT,
      env: {
        ...process.env,
        EMNAPI_LINK_DIR: emnapiLinkDir,
        RUSTFLAGS: "-C target-feature=+atomics,+simd128,+bulk-memory,+mutable-globals -Z unstable-options -C panic=immediate-abort --cfg tokio_unstable",
      },
      maxBuffer: 1024 * 1024 * 50,
    }
  );

  // _initialize must be present or emnapi deadlocks at import.
  const exports = WebAssembly.Module.exports(new WebAssembly.Module(fs.readFileSync(targetWasmFile)));
  if (!exports.some((e) => e.name === "_initialize")) {
    throw new Error("shielded wasm does not export _initialize: crt1-reactor.o was not linked");
  }

  console.log("Running wasm-opt");
  await execTask(`bash ${path.join(ROOT, "scripts", "wasm-opt.sh")}`, {
    env: { ...process.env, OUTPUT_FILE: targetWasmFile },
  });

  const size = fs.statSync(targetWasmFile).size;
  if (size >= CHROME_SYNC_COMPILE_LIMIT) {
    throw new Error(`shielded wasm is ${(size / 1024 / 1024).toFixed(2)}MB — over Chrome's 8MB sync-compile limit`);
  }
  console.log(`shielded wasm size after wasm-opt: ${(size / 1024 / 1024).toFixed(2)}MB`);

  fs.mkdirSync(wasmOutputDir, { recursive: true });
  await convertBinary(targetWasmFile, path.join(wasmOutputDir, "shieldedBytes.cjs"));
  buildWorkerBundle(path.join(wasmOutputDir, "workerBundle.cjs"));
}

async function buildNative() {
  console.log("--- Building Native Binaries ---");

  const darwinTargets = nativeTargets.filter((t) => t.includes("apple-darwin"));
  // zig cannot emit the MSVC ABI, so windows goes through cargo-xwin (clang-cl
  // + lld-link against the Microsoft CRT/SDK headers xwin downloads).
  const windowsTargets = nativeTargets.filter((t) => t.includes("windows"));
  const zigbuildTargets = nativeTargets.filter(
    (t) => !t.includes("apple-darwin") && !t.includes("windows")
  );

  if (darwinTargets.length > 0) {
    const targetFlags = darwinTargets.map((t) => `--target ${t}`).join(" ");
    console.log(`Building darwin targets with cargo: ${darwinTargets.join(", ")}...`);
    await execTask(`cargo build ${targetFlags} ${isRelease ? "--release" : ""}`, {
      env: { ...process.env, RUSTFLAGS: nativeRustflags },
      maxBuffer: 1024 * 1024 * 50,
    });
  }

  if (zigbuildTargets.length > 0) {
    const targetFlags = zigbuildTargets.map((t) => `--target ${t}`).join(" ");
    console.log(`Building cross targets with zigbuild: ${zigbuildTargets.join(", ")}...`);
    await execTask(`cargo zigbuild ${targetFlags} ${isRelease ? "--release" : ""}`, {
      env: { ...process.env, RUSTFLAGS: nativeRustflags },
      maxBuffer: 1024 * 1024 * 50,
    });
  }

  // One invocation per windows target: cargo-xwin injects the SDK/CRT lib paths
  // via RUSTFLAGS, and with several --target flags only the last target's paths
  // survive. Requires XWIN_ACCEPT_LICENSE=1 in the environment.
  for (const target of windowsTargets) {
    console.log(`Building windows target with xwin: ${target}...`);
    await execTask(`cargo xwin build --target ${target} ${isRelease ? "--release" : ""}`, {
      env: { ...process.env, RUSTFLAGS: nativeRustflags },
      maxBuffer: 1024 * 1024 * 50,
    });
  }

  nativeTargets.forEach((target) => {
    let extension;
    // MSVC emits dash_platform_shielded.dll; the unix toolchains prefix with lib.
    let prefix = "lib";
    if (target.includes("apple-darwin")) {
      extension = "dylib";
    } else if (target.includes("windows")) {
      extension = "dll";
      prefix = "";
    } else {
      extension = "so";
    }

    const nativeBinPath = path.join(ROOT, "target", target, buildProfile, `${prefix}${BIN_NAME}.${extension}`);
    const nativeOutputDir = path.join(binariesOutputDir, "native", target);

    if (fs.existsSync(nativeBinPath)) {
      fs.mkdirSync(nativeOutputDir, { recursive: true });
      fs.copyFileSync(nativeBinPath, path.join(nativeOutputDir, `${BIN_NAME}.node`));
      console.log(`Successfully built and copied: ${target}`);
    } else {
      throw new Error(`native build output not found for ${target}: ${nativeBinPath}`);
    }
  });
}

function bundle() {
  console.log("--- Copying js -> dist ---");
  fs.cpSync(path.join(ROOT, "js"), distDir, { recursive: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});