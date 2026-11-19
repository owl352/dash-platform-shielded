import { loadShielded } from '../napi.js';
/**
 * Provider for this package's own proving NAPI surface. There is no dpp here:
 * the shielded module is completely independent.
 */
class ShieldedProvider {
    static instance;
    _shielded = null;
    constructor() { }
    static getInstance() {
        if (ShieldedProvider.instance == null) {
            ShieldedProvider.instance = new ShieldedProvider();
        }
        return ShieldedProvider.instance;
    }
    get hasShielded() {
        return this._shielded != null;
    }
    get shielded() {
        if (this._shielded == null) {
            this._shielded = loadShielded();
        }
        return this._shielded;
    }
}
export const shieldedProvider = ShieldedProvider.getInstance();
