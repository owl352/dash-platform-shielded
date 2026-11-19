import { shieldedProvider } from './provider.js';
const UINT32MAX = 4294967295;
/** Wraps a value with this package's own DynamicValue (no dpp instance involved). */
export function valueToShieldedDynamicValue(value) {
    return wrapDynamicValue(value, shieldedProvider.shielded.DynamicValue);
}
function wrapDynamicValue(value, Ctor) {
    if (typeof value === 'bigint' || (value > UINT32MAX && typeof value !== 'string')) {
        return Ctor.fromBigIntString(BigInt(value.toString()).toString());
    }
    else if (value != null && typeof value === 'object' && typeof value.bytes === 'function') {
        return new Ctor(value.bytes());
    }
    else if (value instanceof Uint8Array) {
        return new Ctor(value);
    }
    else if (Array.isArray(value)) {
        return new Ctor(value.map(v => wrapDynamicValue(v, Ctor)));
    }
    else if (typeof value === 'object' && value !== null) {
        const objectWithDynamicValue = Object.assign({}, value);
        for (const key of Object.keys(value)) {
            objectWithDynamicValue[key] = wrapDynamicValue(value[key], Ctor);
        }
        return new Ctor(objectWithDynamicValue);
    }
    else if (typeof value === 'function') {
        throw new Error('Cannot parse value from function');
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return value > UINT32MAX || value < 0 ? Ctor.fromInt(value) : Ctor.fromUInt(value);
        }
        return Ctor.fromFloat(value);
    }
    else {
        return new Ctor(value);
    }
}
/** Maps a numeric enum value or `platform_vN` string to the u32 the bindings take. */
export function platformVersionToNumber(platformVersion) {
    if (typeof platformVersion === 'number') {
        return platformVersion;
    }
    const match = /^platform_v(\d+)$/i.exec(String(platformVersion));
    if (match == null) {
        throw new Error(`Invalid platform version value: ${String(platformVersion)}`);
    }
    return Number(match[1]);
}
/** Normalizes an identifier-like value to raw 32 bytes. */
export function identifierToBytes(identifier) {
    if (identifier instanceof Uint8Array) {
        return identifier;
    }
    if (identifier != null && typeof identifier.bytes === 'function') {
        return identifier.bytes();
    }
    throw new Error('Invalid identifier: expected Uint8Array or an object with bytes()');
}
