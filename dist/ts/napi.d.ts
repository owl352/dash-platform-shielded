import type * as ShieldedNapi from 'dash-platform-shielded/bindingsTypes';
export type ShieldedProtocol = typeof ShieldedNapi;
/**
 * Loads the proving module (native Node-API addon on Node, threaded wasm
 * elsewhere). The eager entry already loaded it at import; this is also used by
 * the lazy entry and by the moved wrappers on first use.
 */
export declare function loadShielded(): ShieldedProtocol;
