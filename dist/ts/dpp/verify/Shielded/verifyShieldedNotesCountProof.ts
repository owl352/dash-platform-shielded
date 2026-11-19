import { dppProvider } from '../../provider.js'
import { IdentifierLike, PlatformVersionLike, VerifiedShieldedNotesCount } from '../../types.js'
import { identifierToBytes, platformVersionToNumber } from '../../utils.js'

/** `tokenId` selects that token's shielded pool; without it the credits pool is verified **/
export function verifyShieldedNotesCountProof (
  proof: Uint8Array,
  verifySubsetOfProof: boolean,
  platformVersion: PlatformVersionLike,
  tokenId?: IdentifierLike | null
): VerifiedShieldedNotesCount {
  const result = dppProvider.shielded.verifyShieldedNotesCountProof(
    proof,
    verifySubsetOfProof,
    platformVersionToNumber(platformVersion),
    tokenId != null ? identifierToBytes(tokenId) : undefined
  )

  return {
    rootHash: result.rootHash,
    count: result.count != null ? BigInt(result.count) : undefined
  }
}
