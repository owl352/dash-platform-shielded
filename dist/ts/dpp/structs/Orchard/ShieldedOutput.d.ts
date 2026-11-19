import type { ShieldedOutputNAPI } from 'dash-platform-shielded/bindingsTypes';
import { OrchardAddressWASM } from './OrchardAddress.js';
/**
 * One output of a multi-output shielded transfer (`shieldedTransferMulti`):
 * who receives the note, how much, and the memo bytes carried inside it.
 */
export declare class ShieldedOutputWASM {
    /** @private **/
    _rawShieldedOutput: ShieldedOutputNAPI;
    constructor(address: OrchardAddressWASM, amount: bigint, memo: Uint8Array);
    get address(): OrchardAddressWASM;
    set address(value: OrchardAddressWASM);
    get amount(): bigint;
    set amount(value: bigint);
    get memo(): Uint8Array;
    set memo(value: Uint8Array);
    static createFromRawInstance(rawInstance: ShieldedOutputNAPI): ShieldedOutputWASM;
}
