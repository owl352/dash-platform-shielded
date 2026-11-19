import type { ShieldedProtocol } from '../napi.js';
/**
 * Provider for this package's own proving NAPI surface. There is no dpp here:
 * the shielded module is completely independent.
 */
declare class ShieldedProvider {
    private static instance?;
    private _shielded;
    private constructor();
    static getInstance(): ShieldedProvider;
    get hasShielded(): boolean;
    get shielded(): ShieldedProtocol;
}
export declare const shieldedProvider: ShieldedProvider;
export {};
