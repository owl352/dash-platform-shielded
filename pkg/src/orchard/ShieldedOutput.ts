import type { ShieldedOutputNAPI } from '../../binaries/bindingsTypes.js'
import { shieldedProvider } from '../provider.js'
import { OrchardAddressWASM } from './OrchardAddress.js'

/**
 * One output of a multi-output shielded transfer (`shieldedTransferMulti`):
 * who receives the note, how much, and the memo bytes carried inside it.
 */
export class ShieldedOutputWASM {
  /** @private **/
  _rawShieldedOutput: ShieldedOutputNAPI

  constructor (address: OrchardAddressWASM, amount: bigint, memo: Uint8Array) {
    this._rawShieldedOutput = new shieldedProvider.shielded.ShieldedOutputNAPI(
      address._rawOrchardAddress,
      amount.toString(),
      memo
    )
  }

  get address (): OrchardAddressWASM {
    return OrchardAddressWASM.createFromRawInstance(this._rawShieldedOutput.address)
  }

  set address (value: OrchardAddressWASM) {
    this._rawShieldedOutput.address = value._rawOrchardAddress
  }

  get amount (): bigint {
    return BigInt(this._rawShieldedOutput.amount)
  }

  set amount (value: bigint) {
    this._rawShieldedOutput.amount = value.toString()
  }

  get memo (): Uint8Array {
    return this._rawShieldedOutput.memo
  }

  set memo (value: Uint8Array) {
    this._rawShieldedOutput.memo = value
  }

  static createFromRawInstance (rawInstance: ShieldedOutputNAPI): ShieldedOutputWASM {
    const instance: ShieldedOutputWASM = Object.create(ShieldedOutputWASM.prototype)
    instance._rawShieldedOutput = rawInstance

    return instance
  }
}
