//! Direct dashpay-domain serialization for the orchard napi boundary.
//!
//! Every helper here replaces a base-crate napi-class round-trip
//! (`XxxNAPI::from_bytes(..)?.into()` / `XxxNAPI::from(..).bytes()?`) with the
//! exact domain call that class wrapped — same consensus encoding (bincode
//! big-endian / platform serialization), same error statuses and texts.

use dpp::{
    address_funds::{AddressFundsFeeStrategyStep, PlatformAddress},
    bincode,
    fee::Credits,
    group::GroupStateTransitionInfo,
    identifier::Identifier,
    identity::{Identity, IdentityPublicKey, core_script::CoreScript},
    prelude::{AddressNonce, AssetLockProof},
    serialization::{PlatformDeserializableUntrusted, PlatformSerializable},
    shielded::{MEMO_SIZE, SerializedAction, ShieldedMemo},
    state_transition::{StateTransition, public_key_in_creation::IdentityPublicKeyInCreation},
    tokens::token_payment_info::v1::TokenShieldedPayment,
};
use napi::bindgen_prelude::Uint8Array;

use crate::orchard::napi_utils::WithJsError;

/// Consensus bincode decode (big-endian, untrusted-input safeguards) — the
/// exact config every base napi class used. Decode errors map to
/// `Status::InvalidArg`, like the classes' `from_bytes`.
pub fn decode_be<T: bincode::DecodeUntrusted<()>>(bytes: &[u8]) -> Result<T, napi::Error> {
    let config = bincode::config::standard().with_big_endian();

    let (value, _) = bincode::decode_from_slice_untrusted::<T, _>(bytes, config)
        .map_err(|err| napi::Error::new(napi::Status::InvalidArg, err.to_string()))?;

    Ok(value)
}

/// Consensus bincode encode (big-endian). Encode errors map to
/// `Status::GenericFailure`, like the classes' `bytes`.
pub fn encode_be<T: bincode::Encode>(value: &T) -> Result<Vec<u8>, napi::Error> {
    let config = bincode::config::standard().with_big_endian();

    bincode::encode_to_vec(value, config)
        .map_err(|err| napi::Error::new(napi::Status::GenericFailure, err.to_string()))
}

/// `StateTransitionNAPI::from(st).bytes()` -> platform serialization.
pub fn state_transition_to_bytes(value: &StateTransition) -> Result<Uint8Array, napi::Error> {
    Ok(value.serialize_to_bytes().with_js_error()?.into())
}

/// `IdentifierNAPI::from_bytes(b)?.into()` -> raw 32-byte identifier.
pub fn identifier_from_bytes(bytes: &[u8]) -> Result<Identifier, napi::Error> {
    Identifier::from_vec(bytes.to_vec())
        .map_err(|err| napi::Error::new(napi::Status::GenericFailure, err.to_string()))
}

/// `AssetLockProofNAPI::from_bytes(b)?.into()`.
pub fn asset_lock_proof_from_bytes(bytes: &[u8]) -> Result<AssetLockProof, napi::Error> {
    decode_be(bytes)
}

/// `CoreScriptNAPI::from_bytes(b).into()` (infallible, like the class).
pub fn core_script_from_bytes(bytes: &[u8]) -> CoreScript {
    CoreScript::from_bytes(bytes.to_vec())
}

/// `PlatformAddressNAPI::from_bytes(b)?.into()`.
pub fn platform_address_from_bytes(bytes: &[u8]) -> Result<PlatformAddress, napi::Error> {
    PlatformAddress::from_bytes(bytes).with_js_error()
}

/// `IdentityNAPI::from_bytes(b)?.into()`.
pub fn identity_from_bytes(bytes: &[u8]) -> Result<Identity, napi::Error> {
    Identity::deserialize_from_bytes_untrusted(bytes).with_js_error()
}

/// `IdentityPublicKeyNAPI::from_bytes(b)?.into()`.
pub fn identity_public_key_from_bytes(bytes: &[u8]) -> Result<IdentityPublicKey, napi::Error> {
    IdentityPublicKey::deserialize_from_bytes_untrusted(bytes).with_js_error()
}

/// `IdentityPublicKeyInCreationNAPI::from_bytes(b)?.into()`.
pub fn identity_public_key_in_creation_from_bytes(
    bytes: &[u8],
) -> Result<IdentityPublicKeyInCreation, napi::Error> {
    decode_be(bytes)
}

/// `IdentityPublicKeyInCreationNAPI::from(key).bytes()`.
pub fn identity_public_key_in_creation_to_bytes(
    value: &IdentityPublicKeyInCreation,
) -> Result<Uint8Array, napi::Error> {
    Ok(encode_be(value)?.into())
}

/// `GroupStateTransitionInfoNAPI::from_bytes(b)?.into()`.
pub fn group_state_transition_info_from_bytes(
    bytes: &[u8],
) -> Result<GroupStateTransitionInfo, napi::Error> {
    decode_be(bytes)
}

/// `InputAddressNAPI::from_bytes(b)` — the domain input tuple
/// `(PlatformAddress, (AddressNonce, Credits))` the shield builder consumes.
pub fn input_address_from_bytes(
    bytes: &[u8],
) -> Result<(PlatformAddress, (AddressNonce, Credits)), napi::Error> {
    decode_be(bytes)
}

/// `AddressFundsFeeStrategyStepNAPI::from_bytes(b)?.into()`.
pub fn fee_strategy_step_from_bytes(
    bytes: &[u8],
) -> Result<AddressFundsFeeStrategyStep, napi::Error> {
    decode_be(bytes)
}

/// `ShieldedMemoNAPI::from_bytes(b)?.into()` — exactly 36 bytes, then the
/// domain memo parse (same length error text as the class).
pub fn shielded_memo_from_bytes(bytes: &[u8]) -> Result<ShieldedMemo, napi::Error> {
    let fixed: [u8; MEMO_SIZE] = bytes.try_into().map_err(|_| {
        napi::Error::new(
            napi::Status::InvalidArg,
            format!(
                "ShieldedMemo bytes must be exactly {MEMO_SIZE} bytes, got {}",
                bytes.len()
            ),
        )
    })?;

    Ok(ShieldedMemo::from_bytes(&fixed))
}

/// `SerializedActionNAPI::from_bytes(b)?.into()`.
pub fn serialized_action_from_bytes(bytes: &[u8]) -> Result<SerializedAction, napi::Error> {
    decode_be(bytes)
}

/// `SerializedActionNAPI::from(action).bytes()`.
pub fn serialized_action_to_bytes(value: &SerializedAction) -> Result<Uint8Array, napi::Error> {
    Ok(encode_be(value)?.into())
}

/// `TokenShieldedPaymentNAPI::from(payment).bytes()`.
pub fn token_shielded_payment_to_bytes(
    value: &TokenShieldedPayment,
) -> Result<Uint8Array, napi::Error> {
    Ok(encode_be(value)?.into())
}
