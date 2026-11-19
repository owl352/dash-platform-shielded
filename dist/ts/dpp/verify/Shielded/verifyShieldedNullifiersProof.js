import { dppProvider } from '../../provider.js';
import { identifierToBytes, platformVersionToNumber } from '../../utils.js';
/** `tokenId` selects that token's shielded pool; without it the credits pool is verified **/
export function verifyShieldedNullifiersProof(proof, nullifiers, verifySubsetOfProof, platformVersion, tokenId) {
    const result = dppProvider.shielded.verifyShieldedNullifiersProof(proof, nullifiers, verifySubsetOfProof, platformVersionToNumber(platformVersion), tokenId != null ? identifierToBytes(tokenId) : undefined);
    return {
        rootHash: result.rootHash,
        nullifiers: result.nullifiers.map((nullifier) => ({
            nullifier: nullifier.nullifier,
            isSpent: nullifier.isSpent
        }))
    };
}
