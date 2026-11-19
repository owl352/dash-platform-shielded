import type { IdentityCreateFromShieldedPoolResultNAPI } from 'dash-platform-shielded/bindingsTypes';
import { IdentifierWASM } from 'pshenmic-dpp';
import { IdentityPublicKeyInCreationWASM } from 'pshenmic-dpp';
import { SerializedActionWASM } from 'pshenmic-dpp';
/**
 * Result of `identityCreateFromShieldedPool`: the new identity's keys (with
 * proof-of-possession signatures), the proven Orchard bundle fields, the derived
 * identity id, and the client-predicted fee.
 */
export declare class IdentityCreateFromShieldedPoolResultWASM {
    /** @private **/
    _rawIdentityCreateFromShieldedPoolResult: IdentityCreateFromShieldedPoolResultNAPI;
    get publicKeys(): IdentityPublicKeyInCreationWASM[];
    get identityId(): IdentifierWASM;
    get predictedFee(): bigint;
    get actions(): SerializedActionWASM[];
    get anchor(): Uint8Array;
    get proof(): Uint8Array;
    get bindingsSignature(): Uint8Array;
    static createFromRawInstance(rawInstance: IdentityCreateFromShieldedPoolResultNAPI): IdentityCreateFromShieldedPoolResultWASM;
}
