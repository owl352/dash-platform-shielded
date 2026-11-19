import type * as ShieldedNapi from 'dash-platform-shielded/bindingsTypes';
export type ScopeLike = ShieldedNapi.ScopeNAPI | keyof typeof ShieldedNapi.ScopeNAPI | Lowercase<keyof typeof ShieldedNapi.ScopeNAPI>;
export type { DashPlatformProtocol, IdentifierLike, NetworkLike, PlatformAddressLike, PlatformVersionLike, PoolingLike, TokenDistributionLike } from 'pshenmic-dpp';
export interface VerifiedShieldedEncryptedNote {
    cmx: Uint8Array;
    nullifier: Uint8Array;
    cvNet: Uint8Array;
    encryptedNote: Uint8Array;
}
export interface VerifiedShieldedEncryptedNotes {
    rootHash: Uint8Array;
    notes: VerifiedShieldedEncryptedNote[];
    totalCount: bigint;
}
export interface VerifiedShieldedAnchors {
    rootHash: Uint8Array;
    anchors: Uint8Array[];
}
export interface VerifiedMostRecentShieldedAnchor {
    rootHash: Uint8Array;
    anchor?: Uint8Array;
}
export interface VerifiedShieldedPoolState {
    rootHash: Uint8Array;
    totalBalance?: bigint;
}
export interface VerifiedShieldedNotesCount {
    rootHash: Uint8Array;
    count?: bigint;
}
export interface VerifiedShieldedNullifier {
    nullifier: Uint8Array;
    isSpent: boolean;
}
export interface VerifiedShieldedNullifiers {
    rootHash: Uint8Array;
    nullifiers: VerifiedShieldedNullifier[];
}
