import type { IdentityCreateFromShieldedPoolResultNAPI, ShieldedBuilderNAPI, ShieldedWithdrawalResultNAPI } from 'dash-platform-shielded/bindingsTypes';
import type { PlatformVersionLike, PoolingLike } from '../../types.js';
import { OrchardAddressWASM } from './OrchardAddress.js';
import { ShieldedOutputWASM } from './ShieldedOutput.js';
import type { SpendableNoteWASM } from './SpendableNote.js';
export declare class ShieldedWithdrawalResult {
    readonly stateTransition: Uint8Array;
    readonly fee: bigint;
    constructor(raw: ShieldedWithdrawalResultNAPI);
}
export declare class IdentityCreateFromShieldedPoolResult {
    readonly publicKeys: Uint8Array[];
    readonly identityId: Uint8Array;
    readonly predictedFee: bigint;
    readonly actions: Uint8Array[];
    readonly anchor: Uint8Array;
    readonly proof: Uint8Array;
    readonly bindingsSignature: Uint8Array;
    constructor(raw: IdentityCreateFromShieldedPoolResultNAPI);
}
type Amount = bigint | number | string;
/**
 * Builds and proves shielded (Orchard) state transitions. This wrapper is
 * dpp-free: all dpp-side data crosses as bytes/primitives, and the returned
 * state transition is consensus bytes. The consumer wraps the bytes.
 *
 * Construction builds the Halo 2 proving key (~seconds), so create one instance
 * and reuse it.
 */
export declare class ShieldedBuilderWASM {
    /** @private **/
    _rawShieldedBuilder: ShieldedBuilderNAPI;
    private static _initPromise;
    constructor();
    init(): Promise<void>;
    shieldFromAssetLock(recipient: OrchardAddressWASM, shieldAmount: Amount, assetLockProof: Uint8Array, privateKey: Uint8Array, memo: Uint8Array, dummyOutputs: number, senderOvk?: Uint8Array, surplusOutput?: Uint8Array, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    shield(recipient: OrchardAddressWASM, shieldAmount: Amount, inputs: Uint8Array[], privateKeys: Uint8Array[], feeStrategy: Uint8Array[], userFeeIncrease: number, memo: Uint8Array, senderOvk?: Uint8Array, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    shieldedWithdrawal(spends: SpendableNoteWASM[], withdrawalAmount: Amount, outputScript: Uint8Array, coreFeePerByte: number, pooling: PoolingLike, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
    unshield(spends: SpendableNoteWASM[], outputAddress: Uint8Array, unshieldAmount: Amount, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
    shieldedTransfer(spends: SpendableNoteWASM[], recipient: OrchardAddressWASM, transferAmount: Amount, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
    shieldedTransferMulti(spends: SpendableNoteWASM[], outputs: ShieldedOutputWASM[], changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
    identityCreateFromShieldedPool(publicKeys: Uint8Array[], privateKeys: Uint8Array[], denomination: Amount, sendToAddressOnCreationFailure: Uint8Array, spends: SpendableNoteWASM[], changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<IdentityCreateFromShieldedPoolResult>;
    shieldFromIdentity(identity: Uint8Array, recipient: OrchardAddressWASM, shieldAmount: Amount, nonce: Amount, signingKey: Uint8Array, privateKey: Uint8Array, userFeeIncrease: number, memo: Uint8Array, senderOvk?: Uint8Array, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    identityTopUpFromShieldedPool(spends: SpendableNoteWASM[], identityId: Uint8Array, topUpAmount: Amount, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
    documentTokenPayment(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, documentId: Uint8Array, spends: SpendableNoteWASM[], amount: Amount, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenShield(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, recipient: OrchardAddressWASM, amount: Amount, memo: Uint8Array, senderOvk: Uint8Array | undefined | null, identityPublicKey: Uint8Array, privateKey: Uint8Array, identityContractNonce: Amount, userFeeIncrease: number, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenUnshield(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, spends: SpendableNoteWASM[], recipientId: Uint8Array, amount: Amount, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, identityPublicKey: Uint8Array, privateKey: Uint8Array, identityContractNonce: Amount, userFeeIncrease: number, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenShieldedTransfer(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, spends: SpendableNoteWASM[], recipient: OrchardAddressWASM, transferAmount: Amount, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, identityPublicKey: Uint8Array, privateKey: Uint8Array, identityContractNonce: Amount, userFeeIncrease: number, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenMintToPool(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, recipient: OrchardAddressWASM, amount: Amount, memo: Uint8Array, senderOvk: Uint8Array | undefined | null, publicNote: string | undefined | null, usingGroupInfo: Uint8Array | undefined | null, identityPublicKey: Uint8Array, privateKey: Uint8Array, identityContractNonce: Amount, userFeeIncrease: number, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenBurnFromPool(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, spends: SpendableNoteWASM[], amount: Amount, changeAddress: OrchardAddressWASM, seed: Uint8Array, coinType: number, account: number, anchor: Uint8Array, memo: Uint8Array, publicNote: string | undefined | null, usingGroupInfo: Uint8Array | undefined | null, identityPublicKey: Uint8Array, privateKey: Uint8Array, identityContractNonce: Amount, userFeeIncrease: number, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenClaimToPool(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, recipient: OrchardAddressWASM, amount: Amount, distributionType: string | number, claimUpTo: Amount | undefined | null, memo: Uint8Array, senderOvk: Uint8Array | undefined | null, publicNote: string | undefined | null, identityPublicKey: Uint8Array, privateKey: Uint8Array, identityContractNonce: Amount, userFeeIncrease: number, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenDirectPurchaseToPool(tokenId: Uint8Array, ownerId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, recipient: OrchardAddressWASM, tokenCount: Amount, totalAgreedPrice: Amount, memo: Uint8Array, senderOvk: Uint8Array | undefined | null, identityPublicKey: Uint8Array, privateKey: Uint8Array, identityContractNonce: Amount, userFeeIncrease: number, platformVersion?: PlatformVersionLike): Promise<Uint8Array>;
    tokenShieldedTransferWithShieldedFee(tokenId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, tokenSpends: SpendableNoteWASM[], tokenChangeAddress: OrchardAddressWASM, tokenAnchor: Uint8Array, recipient: OrchardAddressWASM, transferAmount: Amount, feeSpends: SpendableNoteWASM[], feeChangeAddress: OrchardAddressWASM, feeAnchor: Uint8Array, seed: Uint8Array, coinType: number, account: number, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
    tokenUnshieldWithShieldedFee(tokenId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, tokenSpends: SpendableNoteWASM[], tokenChangeAddress: OrchardAddressWASM, tokenAnchor: Uint8Array, recipientId: Uint8Array, amount: Amount, feeSpends: SpendableNoteWASM[], feeChangeAddress: OrchardAddressWASM, feeAnchor: Uint8Array, seed: Uint8Array, coinType: number, account: number, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
    tokenPurchaseFromShieldedPool(tokenId: Uint8Array, dataContractId: Uint8Array, tokenContractPosition: number, recipient: OrchardAddressWASM, tokenCount: Amount, totalAgreedPrice: Amount, feeSpends: SpendableNoteWASM[], feeChangeAddress: OrchardAddressWASM, feeAnchor: Uint8Array, seed: Uint8Array, coinType: number, account: number, memo: Uint8Array, platformVersion?: PlatformVersionLike): Promise<ShieldedWithdrawalResult>;
}
export {};
