import { dppProvider } from '../../provider.js';
import { identifierToBytes, platformVersionToNumber } from '../../utils.js';
/** `tokenId` selects that token's shielded pool; without it the credits pool is verified **/
export function verifyShieldedAnchorsProof(proof, verifySubsetOfProof, platformVersion, tokenId) {
    const result = dppProvider.shielded.verifyShieldedAnchorsProof(proof, verifySubsetOfProof, platformVersionToNumber(platformVersion), tokenId != null ? identifierToBytes(tokenId) : undefined);
    return {
        rootHash: result.rootHash,
        anchors: result.anchors
    };
}
