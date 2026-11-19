pub mod most_recent_anchor;
pub mod notes_count;
pub mod pool_state;
pub mod shielded_anchors;
pub mod shielded_encrypted_notes;
pub mod shielded_nullifiers;

use dpp::version::PlatformVersion;
use napi::bindgen_prelude::Uint8Array;

use crate::orchard::napi_utils::platform_version_from_u64;

pub(crate) fn parse_platform_version(
    js_platform_version: u32,
) -> Result<PlatformVersion, napi::Error> {
    platform_version_from_u64(u64::from(js_platform_version))
}

pub(crate) fn parse_token_id(
    js_token_id: Option<Uint8Array>,
) -> Result<Option<[u8; 32]>, napi::Error> {
    js_token_id
        .map(|id| {
            id.to_vec().try_into().map_err(|_| {
                napi::Error::new(napi::Status::InvalidArg, "tokenId must be 32 bytes length")
            })
        })
        .transpose()
}