import type { PlatformVersionNAPI, ShieldTransitionNAPI } from 'pshenmic-dpp/bindingsTypes';
import { InputAddressWASM } from 'pshenmic-dpp';
import { AddressFundsFeeStrategyStepWASM } from 'pshenmic-dpp';
import { AddressWitnessWASM } from 'pshenmic-dpp';
import { SerializedActionWASM } from 'pshenmic-dpp';
import { StateTransitionWASM } from 'pshenmic-dpp';
export declare class ShieldTransitionWASM {
    /** @private **/
    _rawShieldTransition: ShieldTransitionNAPI;
    constructor(inputs: InputAddressWASM[], actions: SerializedActionWASM[], amount: bigint, anchor: Uint8Array, proof: Uint8Array, bindingsSignature: Uint8Array, feeStrategy: AddressFundsFeeStrategyStepWASM[], userFeeIncrease: number, inputWitnesses: AddressWitnessWASM[]);
    get inputs(): InputAddressWASM[];
    set inputs(value: InputAddressWASM[]);
    get actions(): SerializedActionWASM[];
    set actions(value: SerializedActionWASM[]);
    get amount(): bigint;
    set amount(value: bigint);
    get anchor(): Uint8Array;
    set anchor(value: Uint8Array);
    get proof(): Uint8Array;
    set proof(value: Uint8Array);
    get bindingsSignature(): Uint8Array;
    set bindingsSignature(value: Uint8Array);
    get feeStrategy(): AddressFundsFeeStrategyStepWASM[];
    set feeStrategy(value: AddressFundsFeeStrategyStepWASM[]);
    get userFeeIncrease(): number;
    set userFeeIncrease(value: number);
    get inputWitnesses(): AddressWitnessWASM[];
    set inputWitnesses(value: AddressWitnessWASM[]);
    static computeMinimumFee(numActions: number, platformVersion?: PlatformVersionNAPI): bigint;
    toStateTransition(): StateTransitionWASM;
    static fromStateTransition(st: StateTransitionWASM): ShieldTransitionWASM;
    static createFromRawInstance(rawInstance: ShieldTransitionNAPI): ShieldTransitionWASM;
}
