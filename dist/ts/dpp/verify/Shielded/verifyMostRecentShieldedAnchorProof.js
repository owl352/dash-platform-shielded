import { shieldedProvider } from '../../provider.js';
import { identifierToBytes, platformVersionToNumber } from '../../utils.js';
/** `tokenId` selects that token's shielded pool; without it the credits pool is verified **/
export function verifyMostRecentShieldedAnchorProof(proof, verifySubsetOfProof, platformVersion, tokenId) {
    const result = shieldedProvider.shielded.verifyMostRecentShieldedAnchorProof(proof, verifySubsetOfProof, platformVersionToNumber(platformVersion), tokenId != null ? identifierToBytes(tokenId) : undefined);
    return {
        rootHash: result.rootHash,
        anchor: result.anchor ?? undefined
    };
}
