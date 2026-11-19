import loader from '../binaries/loader.cjs'
import type * as ShieldedNapi from '../binaries/bindingsTypes.js'

export type ShieldedProtocol = typeof ShieldedNapi

/**
 * Loads the proving module (native Node-API addon on Node, threaded wasm
 * elsewhere). The eager entry already loaded it at import; this is also used by
 * the lazy entry and by the moved wrappers on first use.
 */
export function loadShielded (): ShieldedProtocol {
  if (loader == null || typeof loader.loadShielded !== 'function') {
    throw new Error(
      'The shielded module is not available in this context. ' +
      'It cannot be loaded in a wasm thread worker.'
    )
  }

  return loader.loadShielded() as ShieldedProtocol
}