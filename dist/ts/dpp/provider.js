import { dpp as dppNapi } from 'pshenmic-dpp';
import { loadShielded } from '../napi.js';
class DppProvider {
    static instance;
    _shielded = null;
    constructor() { }
    static getInstance() {
        if (DppProvider.instance == null) {
            DppProvider.instance = new DppProvider();
        }
        return DppProvider.instance;
    }
    get dpp() {
        return dppNapi;
    }
    get hasShielded() {
        return this._shielded != null;
    }
    /**
     * The proving (Orchard/Halo 2) NAPI surface owned by this package. Loaded on
     * first access so the lazy entry stays deferred.
     */
    get shielded() {
        if (this._shielded == null) {
            this._shielded = loadShielded();
        }
        return this._shielded;
    }
}
export const dppProvider = DppProvider.getInstance();
