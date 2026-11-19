// Minimal Node/ESM declarations so the shielded package builds without
// depending on @types/node just for the loader require.
declare module 'node:module' {
  export function createRequire (url: string): (id: string) => any
}

declare const require: any
declare const module: any