import { shieldedProvider } from '../../provider.js';
import { OrchardAddressWASM } from './OrchardAddress.js';
/**
 * One output of a multi-output shielded transfer (`shieldedTransferMulti`):
 * who receives the note, how much, and the memo bytes carried inside it.
 */
export class ShieldedOutputWASM {
    /** @private **/
    _rawShieldedOutput;
    constructor(address, amount, memo) {
        this._rawShieldedOutput = new shieldedProvider.shielded.ShieldedOutputNAPI(address._rawOrchardAddress, amount.toString(), memo);
    }
    get address() {
        return OrchardAddressWASM.createFromRawInstance(this._rawShieldedOutput.address);
    }
    set address(value) {
        this._rawShieldedOutput.address = value._rawOrchardAddress;
    }
    get amount() {
        return BigInt(this._rawShieldedOutput.amount);
    }
    set amount(value) {
        this._rawShieldedOutput.amount = value.toString();
    }
    get memo() {
        return this._rawShieldedOutput.memo;
    }
    set memo(value) {
        this._rawShieldedOutput.memo = value;
    }
    static createFromRawInstance(rawInstance) {
        const instance = Object.create(ShieldedOutputWASM.prototype);
        instance._rawShieldedOutput = rawInstance;
        return instance;
    }
}
