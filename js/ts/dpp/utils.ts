import type {
  BigIntString,
  DynamicValue,
  IdentifierLikeNAPI,
  PlatformAddressLikeNAPI
} from 'pshenmic-dpp/bindingsTypes'
import { IdentifierWASM, PlatformAddressWASM } from 'pshenmic-dpp'
import { dppProvider } from './provider.js'
import { IdentifierLike, PlatformAddressLike, PlatformVersionLike } from './types.js'

const UINT32MAX = 4294967295

/** The DynamicValue constructor surface shared by the base and shielded instances **/
interface DynamicValueCtor {
  new (value: any): DynamicValue
  fromBigIntString: (value: string) => DynamicValue
  fromInt: (value: number) => DynamicValue
  fromUInt: (value: number) => DynamicValue
  fromFloat: (value: number) => DynamicValue
}

export function valueToDynamicValue (value: any): DynamicValue {
  return wrapDynamicValue(value, dppProvider.dpp.DynamicValue, dppProvider.dpp.IdentifierNAPI)
}

/**
 * Wraps with the SHIELDED instance's DynamicValue. Wrapped napi objects cannot
 * cross the base <-> shielded instance boundary, so arguments destined for
 * shielded methods must use this package's own DynamicValue.
 */
export function valueToShieldedDynamicValue (value: any): DynamicValue {
  return wrapDynamicValue(value, dppProvider.shielded.DynamicValue)
}

function wrapDynamicValue (
  value: any,
  Ctor: DynamicValueCtor,
  IdentifierNAPI?: new (...args: any[]) => any
): DynamicValue {
  if (typeof value === 'bigint' || (value > UINT32MAX && typeof value !== 'string')) {
    return Ctor.fromBigIntString(BigInt(value.toString() as BigIntString).toString())
  } else if (value instanceof IdentifierWASM || (IdentifierNAPI != null && value instanceof IdentifierNAPI)) {
    return new Ctor(value.bytes())
  } else if (value instanceof Uint8Array) {
    return new Ctor(value)
  } else if (Array.isArray(value)) {
    return new Ctor(value.map(v => wrapDynamicValue(v, Ctor, IdentifierNAPI)))
  } else if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value)
    const objectWithDynamicValue: { [key: string]: DynamicValue } = Object.assign({}, value)

    for (const key of keys) {
      objectWithDynamicValue[key] = wrapDynamicValue(value[key], Ctor, IdentifierNAPI)
    }

    return new Ctor(objectWithDynamicValue)
  } else if (typeof value === 'function') {
    throw new Error('Cannot parse value from function')
  } if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      if (value > UINT32MAX || value < 0) {
        return Ctor.fromInt(value)
      } else {
        return Ctor.fromUInt(value)
      }
    } else {
      return Ctor.fromFloat(value)
    }
  } else {
    return new Ctor(value)
  }
}

export function prepareIdentifierValue (identifier: IdentifierLike): IdentifierLikeNAPI {
  if (identifier instanceof IdentifierWASM) {
    return identifier._rawIdentifier
  } else if (identifier instanceof dppProvider.dpp.IdentifierNAPI) {
    return identifier
  } else {
    return new dppProvider.dpp.DynamicValue(identifier)
  }
}

export function preparePlatformAddressValue (address: PlatformAddressLike): PlatformAddressLikeNAPI {
  if (address instanceof PlatformAddressWASM) {
    return address._rawPlatformAddress
  } else if (address instanceof dppProvider.dpp.PlatformAddressNAPI) {
    return address
  } else {
    return new dppProvider.dpp.DynamicValue(address)
  }
}

/** Normalizes an identifier to the 32 raw bytes the shielded verify bindings take. */
export function identifierToBytes (identifier: IdentifierLike): Uint8Array {
  if (identifier instanceof IdentifierWASM) {
    return identifier.bytes()
  } else if (identifier instanceof Uint8Array) {
    return identifier
  } else if (typeof identifier === 'string') {
    return (identifier.length === 64 ? IdentifierWASM.fromHex(identifier) : IdentifierWASM.fromBase58(identifier)).bytes()
  } else {
    return IdentifierWASM.createFromRawInstance(identifier).bytes()
  }
}

/** Maps the numeric enum / `platform_vN` string to the u32 the bindings take. */
export function platformVersionToNumber (platformVersion: PlatformVersionLike): number {
  if (typeof platformVersion === 'number') {
    return platformVersion
  }

  const match = /^platform_v(\d+)$/i.exec(String(platformVersion))

  if (match == null) {
    throw new Error(`Invalid platform version value: ${String(platformVersion)}`)
  }

  return Number(match[1])
}