//! Sealing entries of a private document type (protocol version 15).
//!
//! `PrivateDocumentCreateFromShieldedPool` appends entries that must already
//! be exactly the type's `entrySize` bytes, in the standard private document
//! envelope. This helper turns a document type, its properties and the
//! sender/recipient keys into one such entry: it encodes the properties with
//! dpp's private-document payload encoding, encrypts them to the recipient's
//! key and pads the envelope.

use std::collections::BTreeMap;

use dpp::{
    data_contract::{
        DataContract,
        accessors::v0::DataContractV0Getters,
        document_type::{
            DocumentTypeRef, accessors::DocumentTypeV2Getters,
            encode_private_document_payload, methods::DocumentTypeV0Methods,
        },
    },
    identity::{
        Identity, KeyType, Purpose, accessors::IdentityGettersV0,
        identity_public_key::accessors::v0::IdentityPublicKeyGettersV0,
    },
    platform_value::Value,
    platform_value::converter::serde_json::BTreeValueJsonConverter,
    secp256k1::{PublicKey, SecretKey},
    serialization::PlatformDeserializableWithPotentialValidationFromVersionedStructureUntrusted,
    version::{PlatformVersion, v15::PLATFORM_V15},
};
use napi::{Either, Status, bindgen_prelude::Uint8Array};
use napi_derive::napi;
use platform_encryption::{
    PrivateDocumentEnvelopeError, PrivateDocumentRecipient, PrivateDocumentSender,
    PrivateDocumentTarget, open_private_document_entry, private_document_outgoing_viewing_key,
    recover_sent_private_document_entry, seal_private_document_entry,
};
use rand::{RngCore, rngs::OsRng};

use crate::orchard::{
    napi_utils::{WithJsError, platform_version_from_u64},
    serialize,
};

/// How a sealed entry tells its recipient who wrote it.
#[derive(Clone, Copy)]
enum SenderAuth {
    /// It names nobody.
    Anonymous,
    /// It names the sender's identity and encryption key with a deniable MAC.
    DeniableMac,
}

impl SenderAuth {
    fn from_js(value: Either<String, u32>) -> Result<Self, napi::Error> {
        match value {
            Either::A(text) => match text.to_ascii_lowercase().replace(['_', '-'], "").as_str() {
                "anonymous" => Ok(SenderAuth::Anonymous),
                "deniablemac" => Ok(SenderAuth::DeniableMac),
                "signature" => Err(napi::Error::new(
                    Status::InvalidArg,
                    "signature authentication needs an identity signature and is not supported by \
                     this helper; use anonymous or deniableMac",
                )),
                _ => Err(napi::Error::new(
                    Status::InvalidArg,
                    "invalid sender auth: expected anonymous, deniableMac or signature",
                )),
            },
            Either::B(0) => Ok(SenderAuth::Anonymous),
            Either::B(1) => Ok(SenderAuth::DeniableMac),
            Either::B(2) => Err(napi::Error::new(
                Status::InvalidArg,
                "signature authentication needs an identity signature and is not supported by \
                 this helper; use anonymous or deniableMac",
            )),
            Either::B(_) => Err(napi::Error::new(
                Status::InvalidArg,
                "invalid sender auth: expected 0 (anonymous), 1 (deniableMac) or 2 (signature)",
            )),
        }
    }
}

fn identity_key<'a>(
    identity: &'a Identity,
    key_id: u32,
    role: &str,
) -> Result<&'a dpp::identity::IdentityPublicKey, napi::Error> {
    identity.get_public_key_by_id(key_id).ok_or_else(|| {
        napi::Error::new(
            Status::InvalidArg,
            format!(
                "the {} identity {} has no key {}",
                role,
                identity.id(),
                key_id
            ),
        )
    })
}

fn enabled_point(
    key: &dpp::identity::IdentityPublicKey,
    role: &str,
) -> Result<PublicKey, napi::Error> {
    if key.disabled_at().is_some() {
        return Err(napi::Error::new(
            Status::InvalidArg,
            format!("the {} key {} is disabled", role, key.id()),
        ));
    }
    PublicKey::from_slice(key.data().as_slice()).map_err(|error| {
        napi::Error::new(
            Status::InvalidArg,
            format!(
                "the {} key {} is not a secp256k1 point: {error}",
                role,
                key.id()
            ),
        )
    })
}

fn seal_error(error: PrivateDocumentEnvelopeError) -> napi::Error {
    napi::Error::new(Status::InvalidArg, error.to_string())
}

fn parse_secret_key(bytes: &[u8]) -> Result<SecretKey, napi::Error> {
    let secret: [u8; 32] = bytes.try_into().map_err(|_| {
        napi::Error::new(
            Status::InvalidArg,
            "an encryption private key must be 32 bytes",
        )
    })?;
    SecretKey::from_secret_bytes(secret).map_err(|error| {
        napi::Error::new(
            Status::InvalidArg,
            format!("invalid encryption private key: {error}"),
        )
    })
}

fn parse_contract(
    bytes: &[u8],
    platform_version: &PlatformVersion,
) -> Result<DataContract, napi::Error> {
    DataContract::versioned_deserialize_untrusted(bytes, true, platform_version).with_js_error()
}

fn private_document_type<'a>(
    contract: &'a DataContract,
    document_type_name: &str,
) -> Result<(DocumentTypeRef<'a>, usize), napi::Error> {
    let document_type = contract
        .document_type_for_name(document_type_name)
        .map_err(|error| {
            napi::Error::new(
                Status::InvalidArg,
                format!(
                    "the contract {} has no document type \"{}\": {error}",
                    contract.id(),
                    document_type_name
                ),
            )
        })?;
    let entry_size = document_type
        .private_document()
        .map(|config| config.entry_size() as usize)
        .ok_or_else(|| {
            napi::Error::new(
                Status::InvalidArg,
                format!(
                    "the document type \"{}\" of contract {} is not private",
                    document_type_name,
                    contract.id()
                ),
            )
        })?;
    Ok((document_type, entry_size))
}

fn decode_payload_value(
    document_type: DocumentTypeRef<'_>,
    payload: &[u8],
    platform_version: &PlatformVersion,
) -> Result<serde_json::Value, napi::Error> {
    let properties =
        dpp::data_contract::document_type::decode_private_document_payload(
            document_type,
            payload,
            platform_version,
        )
        .with_js_error()?;
    properties.to_json_value().map_err(|error| {
        napi::Error::new(
            Status::GenericFailure,
            format!("the decoded properties are not valid JSON: {error}"),
        )
    })
}

/// Seals one entry of the private document type `documentTypeName` of
/// `dataContract`, ready to pass to `privateDocumentCreateFromShieldedPool`.
///
/// It encodes `properties` with dpp's private-document payload encoding,
/// encrypts them to `recipientKeyId` of `recipientIdentity`, and pads the
/// standard private-document envelope v1 to the type's `entrySize`.
///
/// - `properties` - JSON object keyed by property name, as a document create
///   takes them (byte arrays hex/base64, identifiers base58/hex). The values
///   are sanitized and encoded against the type; the schema's bounds are not
///   checked here, so validate them against the contract first if required.
/// - `senderIdentity` / `senderEncryptionKeyId` /
///   `senderEncryptionPrivateKey` - the sender's enabled ECDSA_SECP256K1
///   ENCRYPTION key; its secret key seals the entry and derives the outgoing
///   viewing key the sender recovers it with
/// - `recipientIdentity` / `recipientKeyId` - the recipient's enabled
///   ECDSA_SECP256K1 DECRYPTION or ENCRYPTION key the entry is sealed to
/// - `auth` - `"anonymous"` / `0`, or `"deniableMac"` / `1`
/// - `eskSeed` - optional 32-byte fresh seed; omitted draws a random one
/// - `platformVersion` - protocol version (defaults to the latest)
#[napi(js_name = "sealPrivateDocumentEntry")]
#[allow(clippy::too_many_arguments)]
pub fn seal_private_document_entry_napi(
    js_data_contract: Uint8Array,
    js_document_type_name: String,
    js_properties: String,
    js_sender_identity: Uint8Array,
    js_sender_encryption_key_id: u32,
    js_sender_encryption_private_key: Uint8Array,
    js_recipient_identity: Uint8Array,
    js_recipient_key_id: u32,
    js_auth: Either<String, u32>,
    js_esk_seed: Option<Uint8Array>,
    js_platform_version: Option<u32>,
) -> Result<Uint8Array, napi::Error> {
    let platform_version: PlatformVersion = js_platform_version
        .map(|version| platform_version_from_u64(u64::from(version)))
        .transpose()?
        .unwrap_or(PLATFORM_V15);

    let contract = parse_contract(js_data_contract.as_ref(), &platform_version)?;

    let (document_type, entry_size) =
        private_document_type(&contract, &js_document_type_name)?;

    let sender = serialize::identity_from_bytes(js_sender_identity.as_ref())?;
    let recipient = serialize::identity_from_bytes(js_recipient_identity.as_ref())?;

    let sender_key = identity_key(&sender, js_sender_encryption_key_id, "sender")?;
    if sender_key.key_type() != KeyType::ECDSA_SECP256K1
        || sender_key.purpose() != Purpose::ENCRYPTION
    {
        return Err(napi::Error::new(
            Status::InvalidArg,
            format!(
                "the sender key {} is a {:?} {:?} key, not an ECDSA_SECP256K1 ENCRYPTION key",
                sender_key.id(),
                sender_key.key_type(),
                sender_key.purpose()
            ),
        ));
    }
    let sender_public = enabled_point(sender_key, "sender")?;

    let recipient_key = identity_key(&recipient, js_recipient_key_id, "recipient")?;
    if recipient_key.key_type() != KeyType::ECDSA_SECP256K1
        || !matches!(
            recipient_key.purpose(),
            Purpose::DECRYPTION | Purpose::ENCRYPTION
        )
    {
        return Err(napi::Error::new(
            Status::InvalidArg,
            format!(
                "the recipient key {} is a {:?} {:?} key, not an ECDSA_SECP256K1 DECRYPTION or \
                 ENCRYPTION key",
                recipient_key.id(),
                recipient_key.key_type(),
                recipient_key.purpose()
            ),
        ));
    }
    let recipient_public = enabled_point(recipient_key, "recipient")?;

    let secret_key = parse_secret_key(js_sender_encryption_private_key.as_ref())?;
    if PublicKey::from_secret_key(&secret_key).serialize() != sender_public.serialize() {
        return Err(napi::Error::new(
            Status::InvalidArg,
            format!(
                "the sender encryption private key is not the one of the sender key {}",
                sender_key.id()
            ),
        ));
    }

    let properties_value: serde_json::Value = serde_json::from_str(&js_properties).map_err(|error| {
        napi::Error::new(
            Status::InvalidArg,
            format!("invalid document properties JSON: {error}"),
        )
    })?;
    let mut properties: BTreeMap<String, Value> =
        serde_json::from_value(properties_value).map_err(|error| {
            napi::Error::new(
                Status::InvalidArg,
                format!("document properties must be a JSON object keyed by property name: {error}"),
            )
        })?;
    document_type.sanitize_document_properties(&mut properties);

    let payload = encode_private_document_payload(document_type, properties).with_js_error()?;

    let auth = SenderAuth::from_js(js_auth)?;
    let sender_target = match auth {
        SenderAuth::Anonymous => PrivateDocumentSender::Anonymous,
        SenderAuth::DeniableMac => PrivateDocumentSender::DeniableMac {
            identity_id: sender.id().to_buffer(),
            key_id: js_sender_encryption_key_id,
            secret_key: &secret_key,
        },
    };

    let target = PrivateDocumentTarget {
        contract_id: contract.id().to_buffer(),
        document_type_name: &js_document_type_name,
    };
    let recipient_target = PrivateDocumentRecipient {
        identity_id: recipient.id().to_buffer(),
        public_key: &recipient_public,
    };
    let outgoing_viewing_key = private_document_outgoing_viewing_key(&secret_key.to_secret_bytes());

    let provided_seed: Option<[u8; 32]> = js_esk_seed
        .map(|seed| {
            seed.to_vec().as_slice().try_into().map_err(|_| {
                napi::Error::new(Status::InvalidArg, "eskSeed must be 32 bytes")
            })
        })
        .transpose()?;

    let seal = |seed: &[u8; 32]| {
        seal_private_document_entry(
            &target,
            entry_size,
            &recipient_target,
            &sender_target,
            &payload,
            &outgoing_viewing_key,
            seed,
        )
    };

    let entry = match provided_seed {
        Some(seed) => seal(&seed).map_err(seal_error)?,
        None => {
            let mut rng = OsRng;
            loop {
                let mut seed = [0u8; 32];
                rng.fill_bytes(&mut seed);
                match seal(&seed) {
                    Ok(entry) => break entry,
                    Err(PrivateDocumentEnvelopeError::InvalidEphemeralSeed) => continue,
                    Err(error) => return Err(seal_error(error)),
                }
            }
        }
    };

    Ok(Uint8Array::from(entry))
}

/// Opens one sealed entry of a private document type with the recipient's
/// secret key and returns its properties as an object.
///
/// Returns `null` when none of the keys opens the entry, which is the normal
/// case for an entry sealed to someone else.
#[napi(js_name = "openPrivateDocumentEntry")]
#[allow(clippy::too_many_arguments)]
pub fn open_private_document_entry_napi(
    js_data_contract: Uint8Array,
    js_document_type_name: String,
    js_entry: Uint8Array,
    js_recipient_identity: Uint8Array,
    js_recipient_secret_keys: Vec<Uint8Array>,
    js_platform_version: Option<u32>,
) -> Result<Option<serde_json::Value>, napi::Error> {
    let platform_version: PlatformVersion = js_platform_version
        .map(|version| platform_version_from_u64(u64::from(version)))
        .transpose()?
        .unwrap_or(PLATFORM_V15);

    let contract = parse_contract(js_data_contract.as_ref(), &platform_version)?;
    let (document_type, _) = private_document_type(&contract, &js_document_type_name)?;
    let recipient = serialize::identity_from_bytes(js_recipient_identity.as_ref())?;

    if js_recipient_secret_keys.is_empty() {
        return Err(napi::Error::new(
            Status::InvalidArg,
            "at least one recipient secret key is required",
        ));
    }
    let secret_keys: Vec<SecretKey> = js_recipient_secret_keys
        .iter()
        .map(|key| parse_secret_key(key.as_ref()))
        .collect::<Result<_, _>>()?;

    let target = PrivateDocumentTarget {
        contract_id: contract.id().to_buffer(),
        document_type_name: &js_document_type_name,
    };
    let recipient_id = recipient.id().to_buffer();
    let opened =
        open_private_document_entry(js_entry.as_ref(), &target, &recipient_id, &secret_keys)
            .map_err(seal_error)?;

    match opened {
        None => Ok(None),
        Some(opened) => Ok(Some(decode_payload_value(
            document_type,
            opened.payload(),
            &platform_version,
        )?)),
    }
}

/// Recovers an entry the sender sealed, using its outgoing viewing key, and
/// returns its properties as an object.
///
/// Returns `null` when the entry was not sealed with that key.
#[napi(js_name = "recoverSentPrivateDocumentEntry")]
#[allow(clippy::too_many_arguments)]
pub fn recover_sent_private_document_entry_napi(
    js_data_contract: Uint8Array,
    js_document_type_name: String,
    js_entry: Uint8Array,
    js_sender_encryption_private_key: Uint8Array,
    js_platform_version: Option<u32>,
) -> Result<Option<serde_json::Value>, napi::Error> {
    let platform_version: PlatformVersion = js_platform_version
        .map(|version| platform_version_from_u64(u64::from(version)))
        .transpose()?
        .unwrap_or(PLATFORM_V15);

    let contract = parse_contract(js_data_contract.as_ref(), &platform_version)?;
    let (document_type, _) = private_document_type(&contract, &js_document_type_name)?;
    let secret_key = parse_secret_key(js_sender_encryption_private_key.as_ref())?;
    let outgoing_viewing_key =
        private_document_outgoing_viewing_key(&secret_key.to_secret_bytes());

    let target = PrivateDocumentTarget {
        contract_id: contract.id().to_buffer(),
        document_type_name: &js_document_type_name,
    };
    let opened = recover_sent_private_document_entry(
        js_entry.as_ref(),
        &target,
        &outgoing_viewing_key,
    )
    .map_err(seal_error)?;

    match opened {
        None => Ok(None),
        Some(opened) => Ok(Some(decode_payload_value(
            document_type,
            opened.payload(),
            &platform_version,
        )?)),
    }
}
