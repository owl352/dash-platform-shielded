import type { DynamicValue, IdentifierLikeNAPI, PlatformAddressLikeNAPI } from 'pshenmic-dpp/bindingsTypes';
import { IdentifierLike, PlatformAddressLike, PlatformVersionLike } from './types.js';
export declare function valueToDynamicValue(value: any): DynamicValue;
/**
 * Wraps with the SHIELDED instance's DynamicValue. Wrapped napi objects cannot
 * cross the base <-> shielded instance boundary, so arguments destined for
 * shielded methods must use this package's own DynamicValue.
 */
export declare function valueToShieldedDynamicValue(value: any): DynamicValue;
export declare function prepareIdentifierValue(identifier: IdentifierLike): IdentifierLikeNAPI;
export declare function preparePlatformAddressValue(address: PlatformAddressLike): PlatformAddressLikeNAPI;
/** Normalizes an identifier to the 32 raw bytes the shielded verify bindings take. */
export declare function identifierToBytes(identifier: IdentifierLike): Uint8Array;
/** Maps the numeric enum / `platform_vN` string to the u32 the bindings take. */
export declare function platformVersionToNumber(platformVersion: PlatformVersionLike): number;
