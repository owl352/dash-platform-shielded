// SHIELDED (threaded) wasm creation — the Orchard/Halo 2 proving module.
// Loaded ON DEMAND via loadShielded(), which the consumer passes to pshenmic-dpp
// via setShielded(). The wasm path needs shared memory (SharedArrayBuffer /
// cross-origin isolation in browsers) and wasm thread workers, so nothing here
// may run at import time. Requiring this file only sets up the worker branch;
// the bytes are decoded, compiled and instantiated inside loadShielded().
const { WASI } = require('@tybys/wasm-util');
const { getDefaultContext } = require('@emnapi/runtime');
const { instantiateNapiModuleSync, MessageHandler } = require('@emnapi/core');

const emnapiContext = getDefaultContext();
emnapiContext.feature.supportNewFunction = false;
emnapiContext.feature.supportBigInt = false;

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
const nodeWorkerThreads = isNode ? require('worker_threads') : null;
const isWorker = isNode
  ? !nodeWorkerThreads.isMainThread
  : (typeof self !== 'undefined' && !self.document);

if (isWorker) {
  // wasi pthread worker: the main thread posts the compiled module + shared
  // memory here and this instantiates a child-thread copy over them. Async
  // `#[napi]` fns (the Halo 2 proving stack) run on these threads. In Node the
  // main thread spawns `new Worker(__filename)` (this file); in browsers the
  // worker runs the self-contained binaries/wasm/workerBundle.cjs from a Blob URL.
  const postMsg = isNode
    ? (d) => nodeWorkerThreads.parentPort.postMessage(d)
    : (d) => self.postMessage(d);

  if (isNode) {
    // emnapi's threadsafe-function dispatch calls the bare global
    // `postMessage` from pthread contexts (a Web Worker global); Node
    // worker_threads doesn't have it, so polyfill with parentPort.
    globalThis.self = globalThis;
    globalThis.postMessage = postMsg;
  }

  const handler = new MessageHandler({
    postMessage: postMsg,
    onLoad({ wasmModule, wasmMemory }) {
      const wasi = new WASI({ version: 'preview1' });

      return instantiateNapiModuleSync(wasmModule, {
        childThread: true,
        wasi,
        context: emnapiContext,
        postMessage: postMsg,
        overwriteImports(importObject) {
          importObject.env = {
            ...importObject.env,
            ...importObject.napi,
            ...importObject.emnapi,
            memory: wasmMemory
          };
        }
      });
    }
  });

  if (isNode) {
    nodeWorkerThreads.parentPort.on('message', (data) => handler.handle({ data }));
  } else {
    self.onmessage = (e) => handler.handle({ data: e.data });
  }

  module.exports = null;
} else {
  // Main thread only. This block must NEVER run in a worker: it decodes,
  // decompresses and compiles the whole proving module and allocates a fresh
  // 64MB shared memory — workers receive the already-compiled module and the
  // real memory via the 'load' message instead. Running it per worker
  // multiplies init time by the core count (rayon spawns one thread per core
  // while building the proving key).
  let shieldedExports;

  function isMusl() {
    if (process.platform !== 'linux') return false;
    try {
      const report = process.report?.getReport?.();
      return !report?.header?.glibcVersionRuntime;
    } catch {
      return false;
    }
  }

  function getTarget() {
    const platform = process.platform;
    const arch = process.arch;
    if (platform === 'darwin') {
      return arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
    }
    if (platform === 'linux') {
      const libc = isMusl() ? 'musl' : 'gnu';
      return arch === 'arm64' ? `aarch64-unknown-linux-${libc}` : `x86_64-unknown-linux-${libc}`;
    }
    if (platform === 'win32') {
      return arch === 'arm64' ? 'aarch64-pc-windows-msvc' : 'x86_64-pc-windows-msvc';
    }
    return null;
  }

  // Prefer the native Node-API addon on Node (~3x faster proving than wasm).
  // Any load failure (missing addon for this platform/libc, link error) is
  // non-fatal: degrade to the threaded wasm module instead.
  function loadNative() {
    const target = getTarget();
    if (target === null) return null;
    try {
      const nativeModule = require(`./native/${target}/pshenmic_orchard.node`);
      console.log(`running on native orchard (${target})`);
      return nativeModule;
    } catch (error) {
      const reason = String(error?.message ?? error).split('\n')[0];
      console.error(`Failed to load native orchard (${target}): ${reason}. Using WebAssembly instead Node-API`);
      return null;
    }
  }

  // Returns the proving module's napi exports — the native addon on Node when
  // available, else the threaded wasm instance. Idempotent: a second call
  // returns the same instance (the consumer caches it via setShielded).
  function loadShielded() {
    if (shieldedExports !== undefined) {
      return shieldedExports;
    }

    if (isNode) {
      const native = loadNative();
      if (native != null) {
        shieldedExports = native;
        shieldedExports.default = native;
        return shieldedExports;
      }
    }

    // The threaded wasm needs shared memory. Browsers only expose
    // SharedArrayBuffer under cross-origin isolation (COOP/COEP); Node provides
    // it by default (and uses the native addon above instead).
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error(
        'Shielded proving requires SharedArrayBuffer, which is not available in this environment. ' +
        'Browsers only expose it under cross-origin isolation (serve the page with COOP/COEP headers); ' +
        'Node.js provides it by default.'
      );
    }

    const { bytes } = require('./wasm/shieldedBytes.cjs');
    const { decode } = require('./base122.cjs');
    const { decompressSync } = require('fflate');
    const { default: sharedMemory } = require('./memory.cjs');

    const wasmBytes = new Uint8Array(decode(bytes));

    const wasi = new WASI({
      version: 'preview1',
      print: function () {
        console.log.apply(console, arguments);
      },
      printErr: function () {
        console.error.apply(console, arguments);
      }
    });

    let workerBlobUrl;

    const wasm = instantiateNapiModuleSync(decompressSync(wasmBytes), {
      context: emnapiContext,
      wasi,
      // Threads are spawned lazily (first async `#[napi]` call), so
      // instantiation stays synchronous: emnapi only forbids sync loading
      // with a PREloaded worker pool (`reuseWorker.size > 0`). `true` keeps
      // size 0 but returns finished workers to a pool instead of
      // terminating them, so repeated proving calls reuse them.
      reuseWorker: true,
      onCreateWorker() {
        if (isNode) {
          return new nodeWorkerThreads.Worker(__filename);
        }
        // Escape hatch for hosts that want to control worker creation
        // (e.g. strict CSP environments where blob: workers are forbidden).
        if (typeof globalThis.__PSHENMIC_DPP_CREATE_WORKER__ === 'function') {
          return globalThis.__PSHENMIC_DPP_CREATE_WORKER__();
        }
        if (typeof Worker === 'undefined') {
          throw new Error(
            'Cannot create a wasm thread worker: no Worker constructor in this environment. ' +
            'Provide globalThis.__PSHENMIC_DPP_CREATE_WORKER__ returning a Worker running workerBundle.cjs `source`.'
          );
        }
        // Self-contained worker (all emnapi deps inlined) spawned from a Blob
        // URL, so it survives being bundled into a single file: the worker
        // receives the compiled module + shared memory via postMessage and
        // needs no access to this script's URL or the wasm bytes.
        if (workerBlobUrl === undefined) {
          const { source } = require('./wasm/workerBundle.cjs');
          workerBlobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        }
        return new Worker(workerBlobUrl, { name: 'pshenmic-orchard-wasm-thread' });
      },
      overwriteImports(importObject) {
        importObject.env = {
          ...importObject.env,
          ...importObject.napi,
          ...importObject.emnapi,
          memory: sharedMemory
        };
      },
      beforeInit({ instance }) {
        for (const name of Object.keys(instance.exports)) {
          if (name.startsWith('__napi_register__')) {
            instance.exports[name]();
          }
        }
      }
    });

    shieldedExports = wasm.napiModule.exports;
    shieldedExports.default = shieldedExports;
    return shieldedExports;
  }

  module.exports = { loadShielded };
}
