export { OrchardAddressWASM, orchardOvkFromSeed } from './orchard/OrchardAddress.js'
export { FullViewingKeyWASM } from './orchard/FullViewingKey.js'
export { IncomingViewingKeyWASM } from './orchard/IncomingViewingKey.js'
export { NoteWASM } from './orchard/Note.js'
export { MerklePathWASM } from './orchard/MerklePath.js'
export { SpendableNoteWASM } from './orchard/SpendableNote.js'
export { ShieldedOutputWASM } from './orchard/ShieldedOutput.js'
export { CommitmentTreeWASM } from './orchard/CommitmentTree.js'
export { OrchardProverWASM } from './orchard/OrchardProver.js'
export { RecoveredNoteWASM, recoverNotes } from './orchard/RecoveredNote.js'
export {
  IdentityCreateFromShieldedPoolResult,
  ShieldedBuilderWASM,
  ShieldedWithdrawalResult
} from './orchard/ShieldedBuilder.js'

export { verifyShieldedEncryptedNotesProof } from './verify/verifyShieldedEncryptedNotesProof.js'
export { verifyShieldedAnchorsProof } from './verify/verifyShieldedAnchorsProof.js'
export { verifyMostRecentShieldedAnchorProof } from './verify/verifyMostRecentShieldedAnchorProof.js'
export { verifyShieldedPoolStateProof } from './verify/verifyShieldedPoolStateProof.js'
export { verifyShieldedNotesCountProof } from './verify/verifyShieldedNotesCountProof.js'
export { verifyShieldedNullifiersProof } from './verify/verifyShieldedNullifiersProof.js'

export type {
  IdentifierLike,
  NetworkLike,
  PlatformVersionLike,
  PoolingLike,
  ScopeLike,
  VerifiedMostRecentShieldedAnchor,
  VerifiedShieldedAnchors,
  VerifiedShieldedEncryptedNote,
  VerifiedShieldedEncryptedNotes,
  VerifiedShieldedNotesCount,
  VerifiedShieldedNullifier,
  VerifiedShieldedNullifiers,
  VerifiedShieldedPoolState
} from './types.js'
export { loadShielded } from './napi.js'
