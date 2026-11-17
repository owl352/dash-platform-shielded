// Type declaration for the registration entry (index.cjs). Importing
// pshenmic-orchard once publishes its proving loader on the cross-realm global
// symbol Symbol.for('pshenmic-dpp.shielded'); pshenmic-dpp's initShielded()
// discovers it there (no module-name lookup, robust to bundler renaming). The
// proving NAPI surface itself is declared in ../binaries/bindingsTypes.
export declare function loadShielded (): typeof import('../binaries/bindingsTypes.js')