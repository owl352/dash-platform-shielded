// Eager entry (index.cjs): importing the package instantiates the proving module
// and exports its NAPI surface. Pass it to pshenmic-dpp's setShielded().
// Use 'dash-platform-shielded/lazy' when the load must be deferred.
declare const shielded: typeof import('../binaries/bindingsTypes.js')
export = shielded