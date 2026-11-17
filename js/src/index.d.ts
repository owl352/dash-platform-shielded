// Type declaration for the entry (index.cjs). loadShielded() returns the proving
// module instance; the consumer provides it to pshenmic-dpp explicitly via
// setShielded(loadShielded()). Both imports are static (bundler-renaming robust).
// The proving NAPI surface itself is declared in ../binaries/bindingsTypes.
export declare function loadShielded (): typeof import('../binaries/bindingsTypes.js')