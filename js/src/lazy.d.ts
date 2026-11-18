// Deferred entry (lazy.cjs): call loadShielded() to instantiate the proving
// module, then pass it to pshenmic-dpp's setShielded().
export declare function loadShielded (): typeof import('../binaries/bindingsTypes.js')