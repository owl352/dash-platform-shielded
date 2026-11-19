import type { DynamicValue } from 'dash-platform-shielded/bindingsTypes';
import type { IdentifierLike, PlatformVersionLike } from './types.js';
/** Wraps a value with this package's own DynamicValue (no dpp instance involved). */
export declare function valueToShieldedDynamicValue(value: any): DynamicValue;
/** Maps a numeric enum value or `platform_vN` string to the u32 the bindings take. */
export declare function platformVersionToNumber(platformVersion: PlatformVersionLike): number;
/** Normalizes an identifier-like value to raw 32 bytes. */
export declare function identifierToBytes(identifier: IdentifierLike): Uint8Array;
