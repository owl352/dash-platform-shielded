import { shieldedProvider } from '../../provider.js';
import { identifierToBytes, platformVersionToNumber } from '../../utils.js';
/** `tokenId` selects that token's shielded pool; without it the credits pool is verified **/
export function verifyShieldedPoolStateProof(proof, verifySubsetOfProof, platformVersion, tokenId) {
    const result = shieldedProvider.shielded.verifyShieldedPoolStateProof(proof, verifySubsetOfProof, platformVersionToNumber(platformVersion), tokenId != null ? identifierToBytes(tokenId) : undefined);
    return {
        rootHash: result.rootHash,
        totalBalance: result.totalBalance != null ? BigInt(result.totalBalance) : undefined
    };
}
