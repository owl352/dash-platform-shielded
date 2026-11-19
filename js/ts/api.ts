export { OrchardAddressWASM, orchardOvkFromSeed } from './dpp/structs/Orchard/OrchardAddress.js'
export { FullViewingKeyWASM } from './dpp/structs/Orchard/FullViewingKey.js'
export { IncomingViewingKeyWASM } from './dpp/structs/Orchard/IncomingViewingKey.js'
export { NoteWASM } from './dpp/structs/Orchard/Note.js'
export { MerklePathWASM } from './dpp/structs/Orchard/MerklePath.js'
export { SpendableNoteWASM } from './dpp/structs/Orchard/SpendableNote.js'
export { ShieldedOutputWASM } from './dpp/structs/Orchard/ShieldedOutput.js'
export { CommitmentTreeWASM } from './dpp/structs/Orchard/CommitmentTree.js'
export { OrchardProverWASM } from './dpp/structs/Orchard/OrchardProver.js'
export { RecoveredNoteWASM, recoverNotes } from './dpp/structs/Orchard/RecoveredNote.js'
export {
  IdentityCreateFromShieldedPoolResult,
  ShieldedBuilderWASM,
  ShieldedWithdrawalResult
} from './dpp/structs/Orchard/ShieldedBuilder.js'

export { verifyShieldedEncryptedNotesProof } from './dpp/verify/Shielded/verifyShieldedEncryptedNotesProof.js'
export { verifyShieldedAnchorsProof } from './dpp/verify/Shielded/verifyShieldedAnchorsProof.js'
export { verifyMostRecentShieldedAnchorProof } from './dpp/verify/Shielded/verifyMostRecentShieldedAnchorProof.js'
export { verifyShieldedPoolStateProof } from './dpp/verify/Shielded/verifyShieldedPoolStateProof.js'
export { verifyShieldedNotesCountProof } from './dpp/verify/Shielded/verifyShieldedNotesCountProof.js'
export { verifyShieldedNullifiersProof } from './dpp/verify/Shielded/verifyShieldedNullifiersProof.js'

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
} from './dpp/types.js'
export { loadShielded } from './napi.js'
