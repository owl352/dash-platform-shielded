import { shieldedProvider } from '../../provider.js';
import { platformVersionToNumber } from '../../utils.js';
export class ShieldedWithdrawalResult {
    stateTransition;
    fee;
    constructor(raw) {
        this.stateTransition = raw.stateTransition;
        this.fee = BigInt(raw.fee);
    }
}
export class IdentityCreateFromShieldedPoolResult {
    publicKeys;
    identityId;
    predictedFee;
    actions;
    anchor;
    proof;
    bindingsSignature;
    constructor(raw) {
        this.publicKeys = raw.publicKeys;
        this.identityId = raw.identityId;
        this.predictedFee = BigInt(raw.predictedFee);
        this.actions = raw.actions;
        this.anchor = raw.anchor;
        this.proof = raw.proof;
        this.bindingsSignature = raw.bindingsSignature;
    }
}
const amountString = (value) => value.toString();
const version = (value) => value == null ? undefined : platformVersionToNumber(value);
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
    _rawShieldedBuilder;
    static _initPromise = null;
    constructor() {
        // empty
    }
    async init() {
        if (ShieldedBuilderWASM._initPromise == null) {
            ShieldedBuilderWASM._initPromise = shieldedProvider.shielded.ShieldedBuilderNAPI.init()
                .catch((e) => {
                ShieldedBuilderWASM._initPromise = null;
                throw e;
            });
        }
        this._rawShieldedBuilder = await ShieldedBuilderWASM._initPromise;
    }
    async shieldFromAssetLock(recipient, shieldAmount, assetLockProof, privateKey, memo, dummyOutputs, senderOvk, surplusOutput, platformVersion) {
        return await this._rawShieldedBuilder.shieldFromAssetLock(recipient._rawOrchardAddress, amountString(shieldAmount), assetLockProof, privateKey, memo, dummyOutputs, senderOvk, surplusOutput, version(platformVersion));
    }
    async shield(recipient, shieldAmount, inputs, privateKeys, feeStrategy, userFeeIncrease, memo, senderOvk, platformVersion) {
        return await this._rawShieldedBuilder.shield(recipient._rawOrchardAddress, amountString(shieldAmount), inputs, privateKeys, feeStrategy, userFeeIncrease, memo, senderOvk, version(platformVersion));
    }
    async shieldedWithdrawal(spends, withdrawalAmount, outputScript, coreFeePerByte, pooling, changeAddress, seed, coinType, account, anchor, memo, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.shieldedWithdrawal(spends.map(s => s._rawSpendableNote), amountString(withdrawalAmount), outputScript, coreFeePerByte, pooling, changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, version(platformVersion)));
    }
    async unshield(spends, outputAddress, unshieldAmount, changeAddress, seed, coinType, account, anchor, memo, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.unshield(spends.map(s => s._rawSpendableNote), outputAddress, amountString(unshieldAmount), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, version(platformVersion)));
    }
    async shieldedTransfer(spends, recipient, transferAmount, changeAddress, seed, coinType, account, anchor, memo, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.shieldedTransfer(spends.map(s => s._rawSpendableNote), recipient._rawOrchardAddress, amountString(transferAmount), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, version(platformVersion)));
    }
    async shieldedTransferMulti(spends, outputs, changeAddress, seed, coinType, account, anchor, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.shieldedTransferMulti(spends.map(s => s._rawSpendableNote), outputs.map(o => o._rawShieldedOutput), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, version(platformVersion)));
    }
    async identityCreateFromShieldedPool(publicKeys, privateKeys, denomination, sendToAddressOnCreationFailure, spends, changeAddress, seed, coinType, account, anchor, memo, platformVersion) {
        return new IdentityCreateFromShieldedPoolResult(await this._rawShieldedBuilder.identityCreateFromShieldedPool(publicKeys, privateKeys, amountString(denomination), sendToAddressOnCreationFailure, spends.map(s => s._rawSpendableNote), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, version(platformVersion)));
    }
    async shieldFromIdentity(identity, recipient, shieldAmount, nonce, signingKey, privateKey, userFeeIncrease, memo, senderOvk, platformVersion) {
        return await this._rawShieldedBuilder.shieldFromIdentity(identity, recipient._rawOrchardAddress, amountString(shieldAmount), amountString(nonce), signingKey, privateKey, userFeeIncrease, memo, senderOvk, version(platformVersion));
    }
    async identityTopUpFromShieldedPool(spends, identityId, topUpAmount, changeAddress, seed, coinType, account, anchor, memo, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.identityTopUpFromShieldedPool(spends.map(s => s._rawSpendableNote), identityId, amountString(topUpAmount), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, version(platformVersion)));
    }
    async documentTokenPayment(tokenId, ownerId, dataContractId, documentId, spends, amount, changeAddress, seed, coinType, account, anchor, memo, platformVersion) {
        return await this._rawShieldedBuilder.documentTokenPayment(tokenId, ownerId, dataContractId, documentId, spends.map(s => s._rawSpendableNote), amountString(amount), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, version(platformVersion));
    }
    async tokenShield(tokenId, ownerId, dataContractId, tokenContractPosition, recipient, amount, memo, senderOvk, identityPublicKey, privateKey, identityContractNonce, userFeeIncrease, platformVersion) {
        return await this._rawShieldedBuilder.tokenShield(tokenId, ownerId, dataContractId, tokenContractPosition, recipient._rawOrchardAddress, amountString(amount), memo, senderOvk, identityPublicKey, privateKey, amountString(identityContractNonce), userFeeIncrease, version(platformVersion));
    }
    async tokenUnshield(tokenId, ownerId, dataContractId, tokenContractPosition, spends, recipientId, amount, changeAddress, seed, coinType, account, anchor, memo, identityPublicKey, privateKey, identityContractNonce, userFeeIncrease, platformVersion) {
        return await this._rawShieldedBuilder.tokenUnshield(tokenId, ownerId, dataContractId, tokenContractPosition, spends.map(s => s._rawSpendableNote), recipientId, amountString(amount), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, identityPublicKey, privateKey, amountString(identityContractNonce), userFeeIncrease, version(platformVersion));
    }
    async tokenShieldedTransfer(tokenId, ownerId, dataContractId, tokenContractPosition, spends, recipient, transferAmount, changeAddress, seed, coinType, account, anchor, memo, identityPublicKey, privateKey, identityContractNonce, userFeeIncrease, platformVersion) {
        return await this._rawShieldedBuilder.tokenShieldedTransfer(tokenId, ownerId, dataContractId, tokenContractPosition, spends.map(s => s._rawSpendableNote), recipient._rawOrchardAddress, amountString(transferAmount), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, identityPublicKey, privateKey, amountString(identityContractNonce), userFeeIncrease, version(platformVersion));
    }
    async tokenMintToPool(tokenId, ownerId, dataContractId, tokenContractPosition, recipient, amount, memo, senderOvk, publicNote, usingGroupInfo, identityPublicKey, privateKey, identityContractNonce, userFeeIncrease, platformVersion) {
        return await this._rawShieldedBuilder.tokenMintToPool(tokenId, ownerId, dataContractId, tokenContractPosition, recipient._rawOrchardAddress, amountString(amount), memo, senderOvk, publicNote, usingGroupInfo, identityPublicKey, privateKey, amountString(identityContractNonce), userFeeIncrease, version(platformVersion));
    }
    async tokenBurnFromPool(tokenId, ownerId, dataContractId, tokenContractPosition, spends, amount, changeAddress, seed, coinType, account, anchor, memo, publicNote, usingGroupInfo, identityPublicKey, privateKey, identityContractNonce, userFeeIncrease, platformVersion) {
        return await this._rawShieldedBuilder.tokenBurnFromPool(tokenId, ownerId, dataContractId, tokenContractPosition, spends.map(s => s._rawSpendableNote), amountString(amount), changeAddress._rawOrchardAddress, seed, coinType, account, anchor, memo, publicNote, usingGroupInfo, identityPublicKey, privateKey, amountString(identityContractNonce), userFeeIncrease, version(platformVersion));
    }
    async tokenClaimToPool(tokenId, ownerId, dataContractId, tokenContractPosition, recipient, amount, distributionType, claimUpTo, memo, senderOvk, publicNote, identityPublicKey, privateKey, identityContractNonce, userFeeIncrease, platformVersion) {
        return await this._rawShieldedBuilder.tokenClaimToPool(tokenId, ownerId, dataContractId, tokenContractPosition, recipient._rawOrchardAddress, amountString(amount), distributionType, claimUpTo == null ? claimUpTo : amountString(claimUpTo), memo, senderOvk, publicNote, identityPublicKey, privateKey, amountString(identityContractNonce), userFeeIncrease, version(platformVersion));
    }
    async tokenDirectPurchaseToPool(tokenId, ownerId, dataContractId, tokenContractPosition, recipient, tokenCount, totalAgreedPrice, memo, senderOvk, identityPublicKey, privateKey, identityContractNonce, userFeeIncrease, platformVersion) {
        return await this._rawShieldedBuilder.tokenDirectPurchaseToPool(tokenId, ownerId, dataContractId, tokenContractPosition, recipient._rawOrchardAddress, amountString(tokenCount), amountString(totalAgreedPrice), memo, senderOvk, identityPublicKey, privateKey, amountString(identityContractNonce), userFeeIncrease, version(platformVersion));
    }
    async tokenShieldedTransferWithShieldedFee(tokenId, dataContractId, tokenContractPosition, tokenSpends, tokenChangeAddress, tokenAnchor, recipient, transferAmount, feeSpends, feeChangeAddress, feeAnchor, seed, coinType, account, memo, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.tokenShieldedTransferWithShieldedFee(tokenId, dataContractId, tokenContractPosition, tokenSpends.map(s => s._rawSpendableNote), tokenChangeAddress._rawOrchardAddress, tokenAnchor, recipient._rawOrchardAddress, amountString(transferAmount), feeSpends.map(s => s._rawSpendableNote), feeChangeAddress._rawOrchardAddress, feeAnchor, seed, coinType, account, memo, version(platformVersion)));
    }
    async tokenUnshieldWithShieldedFee(tokenId, dataContractId, tokenContractPosition, tokenSpends, tokenChangeAddress, tokenAnchor, recipientId, amount, feeSpends, feeChangeAddress, feeAnchor, seed, coinType, account, memo, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.tokenUnshieldWithShieldedFee(tokenId, dataContractId, tokenContractPosition, tokenSpends.map(s => s._rawSpendableNote), tokenChangeAddress._rawOrchardAddress, tokenAnchor, recipientId, amountString(amount), feeSpends.map(s => s._rawSpendableNote), feeChangeAddress._rawOrchardAddress, feeAnchor, seed, coinType, account, memo, version(platformVersion)));
    }
    async tokenPurchaseFromShieldedPool(tokenId, dataContractId, tokenContractPosition, recipient, tokenCount, totalAgreedPrice, feeSpends, feeChangeAddress, feeAnchor, seed, coinType, account, memo, platformVersion) {
        return new ShieldedWithdrawalResult(await this._rawShieldedBuilder.tokenPurchaseFromShieldedPool(tokenId, dataContractId, tokenContractPosition, recipient._rawOrchardAddress, amountString(tokenCount), amountString(totalAgreedPrice), feeSpends.map(s => s._rawSpendableNote), feeChangeAddress._rawOrchardAddress, feeAnchor, seed, coinType, account, memo, version(platformVersion)));
    }
}
