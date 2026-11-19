import { shieldedProvider } from '../../provider.js';
import { NoteWASM } from './Note.js';
/** A note recovered from a shielded action by trial-decryption. */
export class RecoveredNoteWASM {
    /** @private **/
    _rawRecoveredNote;
    /** The action's global leaf position in the commitment tree. */
    get index() {
        return this._rawRecoveredNote.index;
    }
    get note() {
        return NoteWASM.createFromRawInstance(this._rawRecoveredNote.note);
    }
    get nullifier() {
        return this._rawRecoveredNote.nullifier;
    }
    static createFromRawInstance(rawInstance) {
        const instance = Object.create(RecoveredNoteWASM.prototype);
        instance._rawRecoveredNote = rawInstance;
        return instance;
    }
}
/**
 * Recovers your own notes from a set of shielded actions by trial-decrypting
 * each with the viewing key derived from `seed` (ZIP-32 m/32'/coinType'/account').
 * Only actions addressed to you are returned; `index` is the global leaf position.
 */
export function recoverNotes(actions, seed, coinType, account) {
    // Actions cross as consensus bytes; this package does not depend on dpp.
    return shieldedProvider.shielded
        .recoverNotes(actions, seed, coinType, account)
        .map(RecoveredNoteWASM.createFromRawInstance);
}
