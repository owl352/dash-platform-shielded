import type {
  IdentityCreateFromShieldedPoolResultNAPI,
  ShieldedBuilderNAPI,
  ShieldedWithdrawalResultNAPI
} from 'dash-platform-shielded/bindingsTypes'
import { shieldedProvider } from '../../provider.js'
import type { PlatformVersionLike, PoolingLike } from '../../types.js'
import { platformVersionToNumber } from '../../utils.js'
import { OrchardAddressWASM } from './OrchardAddress.js'
import { ShieldedOutputWASM } from './ShieldedOutput.js'
import type { SpendableNoteWASM } from './SpendableNote.js'

export class ShieldedWithdrawalResult {
  readonly stateTransition: Uint8Array
  readonly fee: bigint

  constructor (raw: ShieldedWithdrawalResultNAPI) {
    this.stateTransition = raw.stateTransition
    this.fee = BigInt(raw.fee)
  }
}

export class IdentityCreateFromShieldedPoolResult {
  readonly publicKeys: Uint8Array[]
  readonly identityId: Uint8Array
  readonly predictedFee: bigint
  readonly actions: Uint8Array[]
  readonly anchor: Uint8Array
  readonly proof: Uint8Array
  readonly bindingsSignature: Uint8Array

  constructor (raw: IdentityCreateFromShieldedPoolResultNAPI) {
    this.publicKeys = raw.publicKeys
    this.identityId = raw.identityId
    this.predictedFee = BigInt(raw.predictedFee)
    this.actions = raw.actions
    this.anchor = raw.anchor
    this.proof = raw.proof
    this.bindingsSignature = raw.bindingsSignature
  }
}

type Amount = bigint | number | string

const amountString = (value: Amount): string => value.toString()
const version = (value?: PlatformVersionLike | null): number | undefined => value == null ? undefined : platformVersionToNumber(value)

/**
 * Builds and proves shielded (Orchard) state transitions. This wrapper is
 * dpp-free: all dpp-side data crosses as bytes/primitives, and the returned
 * state transition is consensus bytes. The consumer wraps the bytes.
 *
 * Construction builds the Halo 2 proving key (~seconds), so create one instance
 * and reuse it.
 */
export class ShieldedBuilderWASM {
  /** @private **/
  _rawShieldedBuilder: ShieldedBuilderNAPI

  private static _initPromise: Promise<ShieldedBuilderNAPI> | null = null

  constructor () {
    // empty
  }

  async init (): Promise<void> {
    if (ShieldedBuilderWASM._initPromise == null) {
      ShieldedBuilderWASM._initPromise = shieldedProvider.shielded.ShieldedBuilderNAPI.init()
        .catch((e: Error) => {
          ShieldedBuilderWASM._initPromise = null
          throw e
        })
    }
    this._rawShieldedBuilder = await ShieldedBuilderWASM._initPromise
  }

  async shieldFromAssetLock (
    recipient: OrchardAddressWASM,
    shieldAmount: Amount,
    assetLockProof: Uint8Array,
    privateKey: Uint8Array,
    memo: Uint8Array,
    dummyOutputs: number,
    senderOvk?: Uint8Array,
    surplusOutput?: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.shieldFromAssetLock(
      recipient._rawOrchardAddress,
      amountString(shieldAmount),
      assetLockProof,
      privateKey,
      memo,
      dummyOutputs,
      senderOvk,
      surplusOutput,
      version(platformVersion)
    )
  }

  async shield (
    recipient: OrchardAddressWASM,
    shieldAmount: Amount,
    inputs: Uint8Array[],
    privateKeys: Uint8Array[],
    feeStrategy: Uint8Array[],
    userFeeIncrease: number,
    memo: Uint8Array,
    senderOvk?: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.shield(
      recipient._rawOrchardAddress,
      amountString(shieldAmount),
      inputs,
      privateKeys,
      feeStrategy,
      userFeeIncrease,
      memo,
      senderOvk,
      version(platformVersion)
    )
  }

  async shieldedWithdrawal (
    spends: SpendableNoteWASM[],
    withdrawalAmount: Amount,
    outputScript: Uint8Array,
    coreFeePerByte: number,
    pooling: PoolingLike,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.shieldedWithdrawal(
      spends.map(s => s._rawSpendableNote),
      amountString(withdrawalAmount),
      outputScript,
      coreFeePerByte,
      pooling,
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      version(platformVersion)
    ))
  }

  async unshield (
    spends: SpendableNoteWASM[],
    outputAddress: Uint8Array,
    unshieldAmount: Amount,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.unshield(
      spends.map(s => s._rawSpendableNote),
      outputAddress,
      amountString(unshieldAmount),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      version(platformVersion)
    ))
  }

  async shieldedTransfer (
    spends: SpendableNoteWASM[],
    recipient: OrchardAddressWASM,
    transferAmount: Amount,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.shieldedTransfer(
      spends.map(s => s._rawSpendableNote),
      recipient._rawOrchardAddress,
      amountString(transferAmount),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      version(platformVersion)
    ))
  }

  async shieldedTransferMulti (
    spends: SpendableNoteWASM[],
    outputs: ShieldedOutputWASM[],
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.shieldedTransferMulti(
      spends.map(s => s._rawSpendableNote),
      outputs.map(o => o._rawShieldedOutput),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      version(platformVersion)
    ))
  }

  async identityCreateFromShieldedPool (
    publicKeys: Uint8Array[],
    privateKeys: Uint8Array[],
    denomination: Amount,
    sendToAddressOnCreationFailure: Uint8Array,
    spends: SpendableNoteWASM[],
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<IdentityCreateFromShieldedPoolResult> {
    return new IdentityCreateFromShieldedPoolResult(await this._rawShieldedBuilder.identityCreateFromShieldedPool(
      publicKeys,
      privateKeys,
      amountString(denomination),
      sendToAddressOnCreationFailure,
      spends.map(s => s._rawSpendableNote),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      version(platformVersion)
    ))
  }

  async shieldFromIdentity (
    identity: Uint8Array,
    recipient: OrchardAddressWASM,
    shieldAmount: Amount,
    nonce: Amount,
    signingKey: Uint8Array,
    privateKey: Uint8Array,
    userFeeIncrease: number,
    memo: Uint8Array,
    senderOvk?: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.shieldFromIdentity(
      identity,
      recipient._rawOrchardAddress,
      amountString(shieldAmount),
      amountString(nonce),
      signingKey,
      privateKey,
      userFeeIncrease,
      memo,
      senderOvk,
      version(platformVersion)
    )
  }

  async identityTopUpFromShieldedPool (
    spends: SpendableNoteWASM[],
    identityId: Uint8Array,
    topUpAmount: Amount,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.identityTopUpFromShieldedPool(
      spends.map(s => s._rawSpendableNote),
      identityId,
      amountString(topUpAmount),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      version(platformVersion)
    ))
  }

  async documentTokenPayment (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    documentId: Uint8Array,
    spends: SpendableNoteWASM[],
    amount: Amount,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.documentTokenPayment(
      tokenId,
      ownerId,
      dataContractId,
      documentId,
      spends.map(s => s._rawSpendableNote),
      amountString(amount),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      version(platformVersion)
    )
  }

  async tokenShield (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    recipient: OrchardAddressWASM,
    amount: Amount,
    memo: Uint8Array,
    senderOvk: Uint8Array | undefined | null,
    identityPublicKey: Uint8Array,
    privateKey: Uint8Array,
    identityContractNonce: Amount,
    userFeeIncrease: number,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.tokenShield(
      tokenId,
      ownerId,
      dataContractId,
      tokenContractPosition,
      recipient._rawOrchardAddress,
      amountString(amount),
      memo,
      senderOvk,
      identityPublicKey,
      privateKey,
      amountString(identityContractNonce),
      userFeeIncrease,
      version(platformVersion)
    )
  }

  async tokenUnshield (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    spends: SpendableNoteWASM[],
    recipientId: Uint8Array,
    amount: Amount,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    identityPublicKey: Uint8Array,
    privateKey: Uint8Array,
    identityContractNonce: Amount,
    userFeeIncrease: number,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.tokenUnshield(
      tokenId,
      ownerId,
      dataContractId,
      tokenContractPosition,
      spends.map(s => s._rawSpendableNote),
      recipientId,
      amountString(amount),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      identityPublicKey,
      privateKey,
      amountString(identityContractNonce),
      userFeeIncrease,
      version(platformVersion)
    )
  }

  async tokenShieldedTransfer (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    spends: SpendableNoteWASM[],
    recipient: OrchardAddressWASM,
    transferAmount: Amount,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    identityPublicKey: Uint8Array,
    privateKey: Uint8Array,
    identityContractNonce: Amount,
    userFeeIncrease: number,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.tokenShieldedTransfer(
      tokenId,
      ownerId,
      dataContractId,
      tokenContractPosition,
      spends.map(s => s._rawSpendableNote),
      recipient._rawOrchardAddress,
      amountString(transferAmount),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      identityPublicKey,
      privateKey,
      amountString(identityContractNonce),
      userFeeIncrease,
      version(platformVersion)
    )
  }

  async tokenMintToPool (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    recipient: OrchardAddressWASM,
    amount: Amount,
    memo: Uint8Array,
    senderOvk: Uint8Array | undefined | null,
    publicNote: string | undefined | null,
    usingGroupInfo: Uint8Array | undefined | null,
    identityPublicKey: Uint8Array,
    privateKey: Uint8Array,
    identityContractNonce: Amount,
    userFeeIncrease: number,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.tokenMintToPool(
      tokenId,
      ownerId,
      dataContractId,
      tokenContractPosition,
      recipient._rawOrchardAddress,
      amountString(amount),
      memo,
      senderOvk,
      publicNote,
      usingGroupInfo,
      identityPublicKey,
      privateKey,
      amountString(identityContractNonce),
      userFeeIncrease,
      version(platformVersion)
    )
  }

  async tokenBurnFromPool (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    spends: SpendableNoteWASM[],
    amount: Amount,
    changeAddress: OrchardAddressWASM,
    seed: Uint8Array,
    coinType: number,
    account: number,
    anchor: Uint8Array,
    memo: Uint8Array,
    publicNote: string | undefined | null,
    usingGroupInfo: Uint8Array | undefined | null,
    identityPublicKey: Uint8Array,
    privateKey: Uint8Array,
    identityContractNonce: Amount,
    userFeeIncrease: number,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.tokenBurnFromPool(
      tokenId,
      ownerId,
      dataContractId,
      tokenContractPosition,
      spends.map(s => s._rawSpendableNote),
      amountString(amount),
      changeAddress._rawOrchardAddress,
      seed,
      coinType,
      account,
      anchor,
      memo,
      publicNote,
      usingGroupInfo,
      identityPublicKey,
      privateKey,
      amountString(identityContractNonce),
      userFeeIncrease,
      version(platformVersion)
    )
  }

  async tokenClaimToPool (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    recipient: OrchardAddressWASM,
    amount: Amount,
    distributionType: string | number,
    claimUpTo: Amount | undefined | null,
    memo: Uint8Array,
    senderOvk: Uint8Array | undefined | null,
    publicNote: string | undefined | null,
    identityPublicKey: Uint8Array,
    privateKey: Uint8Array,
    identityContractNonce: Amount,
    userFeeIncrease: number,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.tokenClaimToPool(
      tokenId,
      ownerId,
      dataContractId,
      tokenContractPosition,
      recipient._rawOrchardAddress,
      amountString(amount),
      distributionType,
      claimUpTo == null ? claimUpTo : amountString(claimUpTo),
      memo,
      senderOvk,
      publicNote,
      identityPublicKey,
      privateKey,
      amountString(identityContractNonce),
      userFeeIncrease,
      version(platformVersion)
    )
  }

  async tokenDirectPurchaseToPool (
    tokenId: Uint8Array,
    ownerId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    recipient: OrchardAddressWASM,
    tokenCount: Amount,
    totalAgreedPrice: Amount,
    memo: Uint8Array,
    senderOvk: Uint8Array | undefined | null,
    identityPublicKey: Uint8Array,
    privateKey: Uint8Array,
    identityContractNonce: Amount,
    userFeeIncrease: number,
    platformVersion?: PlatformVersionLike
  ): Promise<Uint8Array> {
    return await this._rawShieldedBuilder.tokenDirectPurchaseToPool(
      tokenId,
      ownerId,
      dataContractId,
      tokenContractPosition,
      recipient._rawOrchardAddress,
      amountString(tokenCount),
      amountString(totalAgreedPrice),
      memo,
      senderOvk,
      identityPublicKey,
      privateKey,
      amountString(identityContractNonce),
      userFeeIncrease,
      version(platformVersion)
    )
  }

  async tokenShieldedTransferWithShieldedFee (
    tokenId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    tokenSpends: SpendableNoteWASM[],
    tokenChangeAddress: OrchardAddressWASM,
    tokenAnchor: Uint8Array,
    recipient: OrchardAddressWASM,
    transferAmount: Amount,
    feeSpends: SpendableNoteWASM[],
    feeChangeAddress: OrchardAddressWASM,
    feeAnchor: Uint8Array,
    seed: Uint8Array,
    coinType: number,
    account: number,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.tokenShieldedTransferWithShieldedFee(
      tokenId,
      dataContractId,
      tokenContractPosition,
      tokenSpends.map(s => s._rawSpendableNote),
      tokenChangeAddress._rawOrchardAddress,
      tokenAnchor,
      recipient._rawOrchardAddress,
      amountString(transferAmount),
      feeSpends.map(s => s._rawSpendableNote),
      feeChangeAddress._rawOrchardAddress,
      feeAnchor,
      seed,
      coinType,
      account,
      memo,
      version(platformVersion)
    ))
  }

  async tokenUnshieldWithShieldedFee (
    tokenId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    tokenSpends: SpendableNoteWASM[],
    tokenChangeAddress: OrchardAddressWASM,
    tokenAnchor: Uint8Array,
    recipientId: Uint8Array,
    amount: Amount,
    feeSpends: SpendableNoteWASM[],
    feeChangeAddress: OrchardAddressWASM,
    feeAnchor: Uint8Array,
    seed: Uint8Array,
    coinType: number,
    account: number,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.tokenUnshieldWithShieldedFee(
      tokenId,
      dataContractId,
      tokenContractPosition,
      tokenSpends.map(s => s._rawSpendableNote),
      tokenChangeAddress._rawOrchardAddress,
      tokenAnchor,
      recipientId,
      amountString(amount),
      feeSpends.map(s => s._rawSpendableNote),
      feeChangeAddress._rawOrchardAddress,
      feeAnchor,
      seed,
      coinType,
      account,
      memo,
      version(platformVersion)
    ))
  }

  async tokenPurchaseFromShieldedPool (
    tokenId: Uint8Array,
    dataContractId: Uint8Array,
    tokenContractPosition: number,
    recipient: OrchardAddressWASM,
    tokenCount: Amount,
    totalAgreedPrice: Amount,
    feeSpends: SpendableNoteWASM[],
    feeChangeAddress: OrchardAddressWASM,
    feeAnchor: Uint8Array,
    seed: Uint8Array,
    coinType: number,
    account: number,
    memo: Uint8Array,
    platformVersion?: PlatformVersionLike
  ): Promise<ShieldedWithdrawalResult> {
    return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.tokenPurchaseFromShieldedPool(
      tokenId,
      dataContractId,
      tokenContractPosition,
      recipient._rawOrchardAddress,
      amountString(tokenCount),
      amountString(totalAgreedPrice),
      feeSpends.map(s => s._rawSpendableNote),
      feeChangeAddress._rawOrchardAddress,
      feeAnchor,
      seed,
      coinType,
      account,
      memo,
      version(platformVersion)
    ))
  }
}