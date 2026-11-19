// Deferred entry: exporting the wrappers does not load the proving module; it
// is instantiated on first use (or explicitly with loadShielded()).
export * from './index.js'
export { default } from './index.js'
