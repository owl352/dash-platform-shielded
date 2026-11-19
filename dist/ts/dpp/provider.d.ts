import type { DashPlatformProtocol } from 'pshenmic-dpp';
import type { ShieldedProtocol } from '../napi.js';
declare class DppProvider {
    private static instance?;
    private _shielded;
    private constructor();
    static getInstance(): DppProvider;
    get dpp(): DashPlatformProtocol;
    get hasShielded(): boolean;
    /**
     * The proving (Orchard/Halo 2) NAPI surface owned by this package. Loaded on
     * first access so the lazy entry stays deferred.
     */
    get shielded(): ShieldedProtocol;
}
export declare const dppProvider: DppProvider;
export {};
