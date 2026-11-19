import type * as ShieldedNapi from '../binaries/bindingsTypes.js'

/** Anything that can expose raw identifier bytes. */
export type IdentifierLike = Uint8Array | { bytes(): Uint8Array }

/** Network enum value or its string name (`mainnet` / `testnet`). */
export type NetworkLike = number | string

/** Platform version number or `platform_vN` string. */
export type PlatformVersionLike = number | string

/** Withdrawal pooling strategy value or its string name. */
export type PoolingLike = number | string

export type ScopeLike = ShieldedNapi.ScopeNAPI | keyof typeof ShieldedNapi.ScopeNAPI | Lowercase<keyof typeof ShieldedNapi.ScopeNAPI>

export interface VerifiedShieldedEncryptedNote {
  cmx: Uint8Array
  nullifier: Uint8Array
  cvNet: Uint8Array
  encryptedNote: Uint8Array
}

export interface VerifiedShieldedEncryptedNotes {
  rootHash: Uint8Array
  notes: VerifiedShieldedEncryptedNote[]
  totalCount: bigint
}

export interface VerifiedShieldedAnchors {
  rootHash: Uint8Array
  anchors: Uint8Array[]
}

export interface VerifiedMostRecentShieldedAnchor {
  rootHash: Uint8Array
  anchor?: Uint8Array
}

export interface VerifiedShieldedPoolState {
  rootHash: Uint8Array
  totalBalance?: bigint
}

export interface VerifiedShieldedNotesCount {
  rootHash: Uint8Array
  count?: bigint
}

export interface VerifiedShieldedNullifier {
  nullifier: Uint8Array
  isSpent: boolean
}

export interface VerifiedShieldedNullifiers {
  rootHash: Uint8Array
  nullifiers: VerifiedShieldedNullifier[]
}