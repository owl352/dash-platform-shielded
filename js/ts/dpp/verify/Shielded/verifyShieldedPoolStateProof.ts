import { shieldedProvider } from '../../provider.js'
import { IdentifierLike, PlatformVersionLike, VerifiedShieldedPoolState } from '../../types.js'
import { identifierToBytes, platformVersionToNumber } from '../../utils.js'

/** `tokenId` selects that token's shielded pool; without it the credits pool is verified **/
export function verifyShieldedPoolStateProof (
  proof: Uint8Array,
  verifySubsetOfProof: boolean,
  platformVersion: PlatformVersionLike,
  tokenId?: IdentifierLike | null
): VerifiedShieldedPoolState {
  const result = shieldedProvider.shielded.verifyShieldedPoolStateProof(
    proof,
    verifySubsetOfProof,
    platformVersionToNumber(platformVersion),
    tokenId != null ? identifierToBytes(tokenId) : undefined
  )

  return {
    rootHash: result.rootHash,
    totalBalance: result.totalBalance != null ? BigInt(result.totalBalance) : undefined
  }
}
