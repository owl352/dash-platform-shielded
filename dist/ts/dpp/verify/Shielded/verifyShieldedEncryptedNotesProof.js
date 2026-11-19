import { shieldedProvider } from '../../provider.js';
import { identifierToBytes, platformVersionToNumber } from '../../utils.js';
/** `tokenId` selects that token's shielded pool; without it the credits pool is verified **/
export function verifyShieldedEncryptedNotesProof(proof, startIndex, count, maxElements, verifySubsetOfProof, platformVersion, tokenId) {
    const result = shieldedProvider.shielded.verifyShieldedEncryptedNotesProof(proof, startIndex.toString(), count, maxElements, verifySubsetOfProof, platformVersionToNumber(platformVersion), tokenId != null ? identifierToBytes(tokenId) : undefined);
    return {
        rootHash: result.rootHash,
        notes: result.notes.map((note) => ({
            cmx: note.cmx,
            nullifier: note.nullifier,
            cvNet: note.cvNet,
            encryptedNote: note.encryptedNote
        })),
        totalCount: BigInt(result.totalCount)
    };
}
