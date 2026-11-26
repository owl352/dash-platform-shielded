import { shieldedProvider } from '../provider.js'
import type { PlatformVersionLike } from '../types.js'
import { platformVersionToNumber } from '../utils.js'

/** How a sealed private document entry tells its recipient who wrote it. */
export type PrivateDocumentSenderAuth = 'anonymous' | 'deniableMac' | 0 | 1

/**
 * Encodes, encrypts and pads one entry of a private document type (protocol v15),
 * ready to pass as an entry of `ShieldedBuilderWASM.privateDocumentCreateFromShieldedPool`.
 *
 * - `dataContract` - the contract serialized with `DataContractWASM.bytes()`
 * - `documentTypeName` - the private document type
 * - `properties` - the document fields, as a JSON object or JSON string; byte arrays
 *   are hex/base64 and identifiers base58/hex
 * - `senderIdentity` / `senderEncryptionKeyId` / `senderEncryptionPrivateKey` - the
 *   sender's enabled ECDSA_SECP256K1 ENCRYPTION key
 * - `recipientIdentity` / `recipientKeyId` - the recipient's enabled
 *   ECDSA_SECP256K1 DECRYPTION or ENCRYPTION key
 * - `auth` - `'anonymous'`/`0` or `'deniableMac'`/`1`
 * - `eskSeed` - optional 32-byte fresh seed; omitted draws one
 * - `platformVersion` - protocol version (defaults to the latest)
 *
 * Returns an entry of exactly the type's `entrySize` bytes.
 */
export function sealPrivateDocumentEntry (
  dataContract: Uint8Array,
  documentTypeName: string,
  properties: string | Record<string, unknown>,
  senderIdentity: Uint8Array,
  senderEncryptionKeyId: number,
  senderEncryptionPrivateKey: Uint8Array,
  recipientIdentity: Uint8Array,
  recipientKeyId: number,
  auth: PrivateDocumentSenderAuth = 'anonymous',
  eskSeed?: Uint8Array,
  platformVersion?: PlatformVersionLike
): Uint8Array {
  const propertiesJson = typeof properties === 'string' ? properties : JSON.stringify(properties)

  return shieldedProvider.shielded.sealPrivateDocumentEntry(
    dataContract,
    documentTypeName,
    propertiesJson,
    senderIdentity,
    senderEncryptionKeyId,
    senderEncryptionPrivateKey,
    recipientIdentity,
    recipientKeyId,
    auth,
    eskSeed,
    platformVersion == null ? undefined : platformVersionToNumber(platformVersion)
  )
}

/**
 * Opens a sealed private document entry with the recipient's secret key and
 * returns its properties as an object. Returns `null` when none of the keys
 * opens it.
 */
export function openPrivateDocumentEntry (
  dataContract: Uint8Array,
  documentTypeName: string,
  entry: Uint8Array,
  recipientIdentity: Uint8Array,
  recipientSecretKeys: Uint8Array[],
  platformVersion?: PlatformVersionLike
): Record<string, unknown> | null {
  return shieldedProvider.shielded.openPrivateDocumentEntry(
    dataContract,
    documentTypeName,
    entry,
    recipientIdentity,
    recipientSecretKeys,
    platformVersion == null ? undefined : platformVersionToNumber(platformVersion)
  ) as Record<string, unknown> | null
}

/**
 * Recovers an entry the sender sealed, using that sender encryption key's
 * outgoing viewing key, and returns its properties as an object. Returns
 * `null` when the entry was not sealed with that key.
 */
export function recoverSentPrivateDocumentEntry (
  dataContract: Uint8Array,
  documentTypeName: string,
  entry: Uint8Array,
  senderEncryptionPrivateKey: Uint8Array,
  platformVersion?: PlatformVersionLike
): Record<string, unknown> | null {
  return shieldedProvider.shielded.recoverSentPrivateDocumentEntry(
    dataContract,
    documentTypeName,
    entry,
    senderEncryptionPrivateKey,
    platformVersion == null ? undefined : platformVersionToNumber(platformVersion)
  ) as Record<string, unknown> | null
}
