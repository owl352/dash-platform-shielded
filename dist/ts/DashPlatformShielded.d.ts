import * as api from './api.js';
import type { ShieldedProtocol } from './napi.js';
/**
 * Standalone shielded module. Construct it when shielded proving is needed and
 * hand the instance to the SDK:
 *
 *   import { DashPlatformShielded } from 'dash-platform-shielded'
 *   const sdk = new DashPlatformSDK({ ..., shielded: new DashPlatformShielded() })
 *
 * Importing the package does not load the proving module; construction does.
 * `pshenmic-dpp` is not involved at all.
 */
export declare class DashPlatformShielded {
    constructor();
    /** Raw NAPI surface of the loaded proving module. */
    get napi(): ShieldedProtocol;
}
type ShieldedApi = typeof api;
export interface DashPlatformShielded extends ShieldedApi {
}
export {};
